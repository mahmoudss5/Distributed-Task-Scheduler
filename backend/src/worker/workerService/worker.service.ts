import { Inject, Injectable, OnApplicationShutdown, Logger } from '@nestjs/common';
import { CronExpressionParser } from 'cron-parser';
import { ClientKafka, MessagePattern } from '@nestjs/microservices';
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

@Injectable()
export class WorkerService implements OnApplicationShutdown {
  private workerId: string = uuidv4();
  private activeJobs = 0;
  private isShuttingDown = false;
  private readonly logger = new Logger(WorkerService.name);

  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    private readonly redisService: RedisService,
    @InjectRepository(Worker)
    private readonly workerRepository: Repository<Worker>,
    @InjectRepository(Job) private readonly jobRepository: Repository<Job>,
    private readonly jobService: JobsServiceService,
    private readonly eventsGateway: EventsGateway,
  ) {
    kafkaClient.subscribeToResponseOf('job-ready');
    kafkaClient.connect();
    this.registerWorker();
  }

  private async registerWorker(): Promise<void> {
    const worker = new Worker();
    worker.id = this.workerId;
    worker.host = os.hostname();
    worker.status = 'active';
    worker.lastHeartbeat = new Date();
    try {
      await this.workerRepository.save(worker);
    } catch (err) {
      console.error('Failed to save worker:', err);
    }
  }

  @Interval(20000)
  async heartbeat(): Promise<void> {
    if (this.isShuttingDown) return;
    await this.redisService.set(`worker:${this.workerId}:heartbeat`, 'alive', 60);
    this.eventsGateway.broadcastWorkerHeartbeat();
  }

  @MessagePattern('job-ready')
  async handleJobReadyMessage(message: any): Promise<void> {
    await this.applyBackpressure();

    const { jobId } = message.value;
    if (!(await this.jobService.claimJob(jobId))) {
      this.logger.warn(`Job ${jobId} is already claimed by another worker.`);
      return;
    }

    this.activeJobs++;
    try {
      const currentJob = await this.claimAndLockJob(jobId);
      if (!currentJob) return;

      await this.processJob(currentJob);
    } finally {
      this.activeJobs--;
    }
  }

  private async applyBackpressure(): Promise<void> {
    while (this.activeJobs >= 5) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  private async claimAndLockJob(jobId: string): Promise<Job | null> {
    const currentJob = await this.jobRepository.findOne({ where: { id: jobId } });
    if (!currentJob) return null;

    currentJob.workerId = this.workerId;
    return await this.jobRepository.save(currentJob);
  }

  private async processJob(currentJob: Job): Promise<void> {
    try {
      this.logger.log(`Executing job ${currentJob.id} of type ${currentJob.type}`);
      await this.jobService.executeJob(currentJob);
      this.logger.log(`Successfully completed job ${currentJob.id}`);

      await this.handleJobCompletion(currentJob);
    } catch (error) {
      this.logger.error(`Failed to execute job ${currentJob.id}`, error);
      await this.handleJobFailure(currentJob);
    }
  }

  private async handleJobCompletion(currentJob: Job): Promise<void> {
    await this.jobRepository.update(currentJob.id, {
      status: JobStatus.COMPLETED,
    });

    if (currentJob.cron) {
      await this.rescheduleCronJob(currentJob);
    }
  }

  private async rescheduleCronJob(currentJob: Job): Promise<void> {
    const interval = CronExpressionParser.parse(currentJob.cron!);
    const nextRun = interval.next().toDate();
    const newJob = this.jobService.JobCorn(currentJob, nextRun);
    await this.jobRepository.save(newJob);
    this.logger.log(`Job ${currentJob.id} rescheduled via cron for ${nextRun}`);
  }

  private async handleJobFailure(currentJob: Job): Promise<void> {
    if (currentJob.retryCount <= 0) {
      await this.jobRepository.update(currentJob.id, {
        status: JobStatus.FAILED,
      });
      this.logger.warn(`Job ${currentJob.id} permanently failed.`);
    } else {
      const powerForNextTry = 3 - currentJob.retryCount;
      await this.jobService.updateJobRetryDelay(currentJob.id, powerForNextTry);
      
      // Decrease retry count and reset status to pending for the scheduler to pick it up again
      currentJob.retryCount -= 1;
      currentJob.status = JobStatus.PENDING;
      currentJob.workerId = null as any; 
      await this.jobRepository.save(currentJob);
      
      this.logger.log(`Job ${currentJob.id} will be retried (remaining attempts: ${currentJob.retryCount})`);
    }
  }

  async onApplicationShutdown(signal?: string) {
    this.logger.log(`Received ${signal}. Starting graceful shutdown...`);
    this.isShuttingDown = true;
    
    await this.kafkaClient.close();
    
    await this.workerRepository.update(this.workerId, { status: JobStatus.DEAD });
    await this.redisService.del(`worker:${this.workerId}:heartbeat`);

    if (this.activeJobs > 0) {
      this.logger.log(`Waiting for ${this.activeJobs} active jobs to finish...`);
      while (this.activeJobs > 0) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
    
    this.logger.log('Graceful shutdown completed.');
  }
}
