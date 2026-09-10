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
    const worker = new Worker();
    worker.id = this.workerId;
    worker.host = os.hostname();
    worker.status = 'active';
    worker.lastHeartbeat = new Date();
    this.workerRepository
      .save(worker)
      .catch((err) => console.error('Failed to save worker:', err));
  }

  @Interval(20000)
  async heartbeat(): Promise<void> {
    await this.redisService.set(
      `worker:${this.workerId}:heartbeat`,
      'alive',
      60,
    );
    this.eventsGateway.broadcastWorkerHeartbeat();
  }

  @MessagePattern('job-ready')
  async handleJobReadyMessage(message: any): Promise<void> {
    // Backpressure: pause processing if we're overwhelmed
    while (this.activeJobs >= 5) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    this.activeJobs++;
    try {
      const { jobId, jobData } = message.value;
      console.log(`Received job-ready message for jobId: ${jobId}`);

      const currentJob = await this.jobRepository.findOne({
        where: { id: jobId },
      });
      if (!currentJob) return;

      currentJob.workerId = this.workerId;
      await this.jobRepository.save(currentJob);
      
      try {
        // Implement the actual logic to process the job
        this.logger.log(`Executing job ${currentJob.id} of type ${currentJob.type}`);
        
        // Mocking a heavy task (e.g., HTTP request, script execution, etc.)
        await new Promise((resolve) => setTimeout(resolve, 2000));
        
        this.logger.log(`Successfully completed job ${currentJob.id}`);

        // Mark the job as completed
        await this.jobRepository.update(currentJob.id, {
          status: JobStatus.COMPLETED,
        });

        // Reschedule if it's a cron job
        if (currentJob.cron) {
          const interval = CronExpressionParser.parse(currentJob.cron);
          const nextRun = interval.next().toDate();

          const newJob = this.jobRepository.create({
            type: currentJob.type,
            userId: currentJob.userId,
            jobPayload: currentJob.jobPayload,
            priority: currentJob.priority,
            priorityLevel: currentJob.priorityLevel,
            cron: currentJob.cron,
            retryCount: 3, // Assuming 3 is the default max retries
            runAt: nextRun,
            status: JobStatus.PENDING,
          });
          await this.jobRepository.save(newJob);
          console.log(`Job ${currentJob.id} rescheduled via cron for ${nextRun}`);
        }
      } catch (error) {
        if (currentJob.retryCount === 0) {
          await this.jobRepository.update(currentJob.id, {
            status: JobStatus.FAILED,
          });
        } else {
          const powerForNextTry = 3 - currentJob.retryCount;
          await this.jobService.updateJobRetryDelay(jobId, powerForNextTry);
        }
      }
    } finally {
      this.activeJobs--;
    }
  }

  async onApplicationShutdown(signal?: string) {
    this.logger.log(`Received ${signal}. Starting graceful shutdown...`);
    this.isShuttingDown = true;
    
    // Stop accepting new jobs by closing the Kafka client
    await this.kafkaClient.close();
    
    // Mark worker as offline
    await this.workerRepository.update(this.workerId, { status: JobStatus.DEAD });
    await this.redisService.del(`worker:${this.workerId}:heartbeat`);

    // Wait for active jobs to finish
    if (this.activeJobs > 0) {
      this.logger.log(`Waiting for ${this.activeJobs} active jobs to finish...`);
      while (this.activeJobs > 0) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
    
    this.logger.log('Graceful shutdown completed.');
  }
}
