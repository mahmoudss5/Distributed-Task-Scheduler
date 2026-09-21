import {
  Inject,
  Injectable,
  OnApplicationShutdown,
  Logger,
} from '@nestjs/common';
import { CronExpressionParser } from 'cron-parser';
import { ClientKafka } from '@nestjs/microservices';
import { Interval } from '@nestjs/schedule';
import { RedisService } from '../../redis/redis.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Worker } from '../entities/worker.entity';
import { v4 as uuidv4 } from 'uuid';
import * as os from 'os';
import { Job } from '../../jobs/entites/job.entity';
import { JobStatus } from '../../jobs/entites/job-status.enum';
import { JobsServiceService } from '../../jobs/jobs-service/jobs-service.service';
import { EventsGateway } from '../../events/events.gateway';
import { JobFailure } from '../../jobs/entites/job-failure.entity';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class WorkerService implements OnApplicationShutdown {
  private workerId: string = uuidv4();
  private activeJobs = 0;
  private isShuttingDown = false;
  private readonly logger = new Logger(WorkerService.name);
  private readonly maxConcurrency = 5;
  private readonly dlqTopic = process.env.KAFKA_DLQ_TOPIC ?? 'job-dlq';
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    private readonly redisService: RedisService,
    @InjectRepository(Worker)
    private readonly workerRepository: Repository<Worker>,
    @InjectRepository(Job) private readonly jobRepository: Repository<Job>,
    @InjectRepository(JobFailure)
    private readonly jobFailureRepository: Repository<JobFailure>,
    private readonly jobService: JobsServiceService,
    private readonly eventsGateway: EventsGateway,
  ) {
    this.registerWorker();
  }

  private async registerWorker(): Promise<void> {
    const host = os.hostname();
    const now = new Date();
    try {
      // Reuse the worker record for this container when the application is
      // restarted. Creating a new UUID on every restart leaves historical
      // rows that the dashboard incorrectly presents as live worker nodes.
      const existingWorker = await this.workerRepository.findOne({
        where: { host },
        order: { lastHeartbeat: 'DESC' },
      });

      if (existingWorker) {
        this.workerId = existingWorker.id;
        await this.workerRepository.update(this.workerId, {
          status: 'active',
          lastHeartbeat: now,
        });
        return;
      }

      const worker = this.workerRepository.create({
        id: this.workerId,
        host,
        status: 'active',
        lastHeartbeat: now,
      });
      await this.workerRepository.save(worker);
    } catch (err) {
      this.logger.error('Failed to save worker', err);
    }
  }

  @Interval(20000)
  async heartbeat(): Promise<void> {
    if (this.isShuttingDown) return;
    await this.redisService.set(
      `worker:${this.workerId}:heartbeat`,
      'alive',
      60,
    );
    await this.workerRepository.update(this.workerId, {
      lastHeartbeat: new Date(),
    });
    this.eventsGateway.broadcastWorkerHeartbeat();
  }

  @Interval(30000)
  async republishUnpublishedDeadLetters(): Promise<void> {
    if (this.isShuttingDown) return;

    const failures = await this.jobFailureRepository.find({
      where: { permanent: true, dlqPublished: false },
      order: { failedAt: 'ASC' },
      take: 100,
    });

    for (const failure of failures) {
      const lockKey = `dlq-republish:${failure.id}`;
      if (!(await this.redisService.setNX(lockKey, this.workerId, 60))) continue;
      try {
        await this.publishFailureToDeadLetterQueue(failure);
      } finally {
        await this.redisService.del(lockKey);
      }
    }
  }

  async handleJobReadyMessage(message: any): Promise<void> {
    await this.applyBackpressure();
    const { jobId } = message;
    this.logger.log(`Received job-ready event for job ${jobId}`);
    if (await this.jobService.isCanceled(jobId)) {
      this.logger.warn(`Job ${jobId} has been canceled. Skipping execution.`);
      return;
    }
    if (!(await this.jobService.claimJob(jobId, this.workerId))) {
      this.logger.warn(`Job ${jobId} is already claimed by another worker.`);
      return;
    }

    this.activeJobs++;
    try {
      const currentJob = await this.claimAndLockJob(jobId);
      if (!currentJob) return;

      await this.processJob(currentJob);

    }
    finally {
      this.activeJobs--;
    }
  }

  private async applyBackpressure(): Promise<void> {
    while (this.activeJobs >= this.maxConcurrency && !this.isShuttingDown) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  private async claimAndLockJob(jobId: string): Promise<Job | null> {
    const currentJob = await this.jobRepository.findOne({
      where: { id: jobId },
    });
    if (!currentJob) return null;

    return currentJob;
  }

  private async processJob(currentJob: Job): Promise<void> {
    try {
      this.logger.log(
        `Executing job ${currentJob.id} of type ${currentJob.type}`,
      );
      await this.jobService.executeJob(currentJob);
      this.logger.log(`Successfully completed job ${currentJob.id}`);

      await this.handleJobCompletion(currentJob);
    } catch (error: unknown) {
      this.logger.error(`Failed to execute job ${currentJob.id}`, error);
      await this.handleJobFailure(currentJob, error);
    }
  }

  private async handleJobCompletion(currentJob: Job): Promise<void> {
    const result = await this.jobRepository.update(
      { id: currentJob.id, status: JobStatus.PROCESSING },
      {
      status: JobStatus.COMPLETED,
      },
    );

    if (result.affected === 1 && currentJob.cron) {
      await this.rescheduleCronJob(currentJob);
    }
    if (result.affected === 1) {
      this.eventsGateway.broadcastJobStatusChanged();
      this.eventsGateway.broadcastStatsUpdate();
    }
  }

  private async rescheduleCronJob(currentJob: Job): Promise<void> {
    const interval = CronExpressionParser.parse(currentJob.cron!);
    const nextRun = interval.next().toDate();
    const newJob = this.jobService.JobCorn(currentJob, nextRun);
    await this.jobRepository.save(newJob);
    this.logger.log(`Job ${currentJob.id} rescheduled via cron for ${nextRun}`);
  }

  private async handleJobFailure(
    currentJob: Job,
    error: unknown,
  ): Promise<void> {
    const failure = this.jobFailureRepository.create({
      jobId: currentJob.id,
      attemptNumber: currentJob.attemptCount || 1,
      retryCountBeforeFailure: currentJob.retryCount ?? 0,
      permanent: (currentJob.retryCount ?? 0) <= 0,
      jobType: currentJob.type,
      userId: currentJob.userId,
      workerId: currentJob.workerId,
      jobPayload: this.sanitizeValue(currentJob.jobPayload),
      errorMessage: this.getErrorMessage(error),
      errorName: error instanceof Error ? error.name : undefined,
      errorStack: error instanceof Error ? error.stack : undefined,
      dlqTopic: (currentJob.retryCount ?? 0) <= 0 ? this.dlqTopic : undefined,
    });
    const savedFailure = await this.jobFailureRepository.save(failure);

    if ((currentJob.retryCount ?? 0) <= 0) {
      const result = await this.jobRepository.update(
        {
          id: currentJob.id,
          status: JobStatus.PROCESSING,
          workerId: currentJob.workerId,
        },
        { status: JobStatus.FAILED },
      );
      if (result.affected !== 1) return;
      await this.publishFailureToDeadLetterQueue(savedFailure);
      this.eventsGateway.broadcastJobStatusChanged();
      this.eventsGateway.broadcastStatsUpdate();
      this.eventsGateway.broadcastJobFailed(currentJob.id, this.getErrorMessage(error), currentJob.type);
      this.logger.warn(
        `Job ${currentJob.id} permanently failed after ${savedFailure.attemptNumber} attempt(s).`,
      );
    } else {
      const powerForNextTry = 3 - currentJob.retryCount;
      await this.jobService.updateJobRetryDelay(
        currentJob.id,
        powerForNextTry,
        currentJob.workerId,
      );

      // Decrease retry count and reset status to pending for the scheduler to pick it up again
      await this.jobRepository.update(
        { id: currentJob.id, status: JobStatus.PENDING, workerId: currentJob.workerId },
        { workerId: null as any },
      );

      this.eventsGateway.broadcastJobStatusChanged();
      this.eventsGateway.broadcastStatsUpdate();

      this.logger.log(
        `Job ${currentJob.id} will be retried (remaining attempts: ${currentJob.retryCount})`,
      );
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    try {
      return JSON.stringify(error) || 'Unknown job execution error';
    } catch {
      return 'Unknown job execution error';
    }
  }

  private sanitizeValue(value: unknown): any {
    if (Array.isArray(value)) return value.map((item) => this.sanitizeValue(item));
    if (!value || typeof value !== 'object') return value;

    const sensitiveKeys = new Set([
      'password',
      'pass',
      'token',
      'access_token',
      'refresh_token',
      'secret',
      'api_key',
      'apikey',
      'otp',
    ]);
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        sensitiveKeys.has(key.toLowerCase()) ? '[REDACTED]' : this.sanitizeValue(item),
      ]),
    );
  }

  private async publishFailureToDeadLetterQueue(failure: JobFailure): Promise<void> {
    const message = {
      failureId: failure.id,
      jobId: failure.jobId,
      type: failure.jobType,
      userId: failure.userId,
      workerId: failure.workerId,
      payload: failure.jobPayload,
      attemptNumber: failure.attemptNumber,
      retryCountBeforeFailure: failure.retryCountBeforeFailure,
      error: {
        name: failure.errorName,
        message: failure.errorMessage,
        stack: failure.errorStack,
      },
      failedAt: failure.failedAt,
      source: 'taskflow-worker',
    };

    try {
      await lastValueFrom(this.kafkaClient.emit(this.dlqTopic, message));
      await this.jobFailureRepository.update(failure.id, {
        dlqPublished: true,
        dlqPublishedAt: new Date(),
      });
      this.logger.log(`Published failed job ${failure.jobId} to ${this.dlqTopic}`);
    } catch (publishError: unknown) {
      // Do not lose the durable failure record if Kafka is temporarily down.
      this.logger.error(
        `Could not publish failed job ${failure.jobId} to ${this.dlqTopic}; failure remains stored in the database.`,
        publishError,
      );
    }
  }

  async onApplicationShutdown(signal?: string) {
    this.logger.log(`Received ${signal}. Starting graceful shutdown...`);
    this.isShuttingDown = true;

    await this.kafkaClient.close();

    await this.workerRepository.update(this.workerId, { status: 'dead' });
    await this.redisService.del(`worker:${this.workerId}:heartbeat`);

    if (this.activeJobs > 0) {
      this.logger.log(
        `Waiting for ${this.activeJobs} active jobs to finish...`,
      );
      while (this.activeJobs > 0) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    this.logger.log('Graceful shutdown completed.');
  }
}
