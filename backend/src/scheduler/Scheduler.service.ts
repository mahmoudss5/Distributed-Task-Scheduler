import { Injectable, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Interval } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { JobStatus } from '../jobs/entites/job-status.enum';
import { Job } from '../jobs/entites/job.entity';
import { JobsServiceService } from '../jobs/jobs-service/jobs-service.service';
import { of } from 'rxjs';
import { Worker } from '../worker/entities/worker.entity';
import { RedisService } from '../redis/redis.service';
import { LeaderElectionService } from './LeaderElectionService';
import { JobPriorityLevel } from '../jobs/entites/job-priority-level.enum';
import { KafkaLagService } from './kafka-lag.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditLogAction } from '../audit-log/enums/audit-log-action.enum';

@Injectable()
export class SchedulerService {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    private readonly redisService: RedisService,
    private readonly jobsService: JobsServiceService,
    @InjectRepository(Worker)
    private readonly workerRepository: Repository<Worker>,
    @InjectRepository(Job) private readonly jobRepository: Repository<Job>,
    private readonly leaderElectionService: LeaderElectionService,
    private readonly kafkaLagService: KafkaLagService,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Interval(10000)
  async increaseJobPriority() {
    if (!this.leaderElectionService.amILeader()) return;
    let jobList: Job[] = await this.jobsService.fetchPendingJobsForScheduler();
    jobList.forEach((job) => {
      job.priority = job.priority + 2;
      if (
        job.priority >= 10 &&
        job.priority <= 15 &&
        job.priorityLevel !== JobPriorityLevel.MEDIUM
      ) {
        this.jobsService.updateJobPriorityLevel(
          job.id,
          JobPriorityLevel.MEDIUM,
        );
      }
      if (job.priority >= 15 && job.priorityLevel !== JobPriorityLevel.HIGH) {
        this.jobsService.updateJobPriorityLevel(job.id, JobPriorityLevel.HIGH);
      }
    });
  }

  @Interval(20000)
  async scheduleJob(): Promise<void> {
    // check if this workere is the leader
    if (!this.leaderElectionService.amILeader()) {
      return;
    }
    // Check if there are already too many jobs queued up in Kafka (lag > 10)
    const lag = await this.kafkaLagService.getConsumerLag('job-ready', 'my-app');
    if (lag > 10) {
      console.log(`Kafka lag is ${lag} (> 10). Pausing job scheduling.`);
      await this.auditLogService.createLog(
        AuditLogAction.SCHEDULER_PAUSED,
        'Scheduler',
        'System',
        undefined,
        { lag, reason: 'Kafka consumer lag exceeded threshold of 10' }
      );
      return;
    }

    let jobList: Job[] = await this.jobsService.fetchPendingJobsForScheduler();
    for (const job of jobList) {
      if (job.runAt > new Date()) {
        continue;
      }
      // check idempotency key
      const key=`job-idempotency-key:${job.id}`;
      if(await this.redisService.get(key)){
        console.log(`Job ${job.id} is already being processed.`);
        continue;
      }
      else{
        this.kafkaClient.emit('job-ready', {
          jobId: job.id,
          jobData: job.jobPayload,
        });
        this.redisService.set(key,'true',60);
      }

      await this.jobsService.updateJobStatus(job.id, JobStatus.PROCESSING);
    }
  }

  @Interval(30000)
  async checkDeadWorkeres(): Promise<void> {
    const activeWrokers: Worker[] = await this.workerRepository.find({
      where: { status: 'active' },
    });
    for (const worker of activeWrokers) {
      const isAlive = await this.redisService.get(
        `worker:${worker.id}:heartbeat`,
      );
      if (!isAlive) {
        await this.auditLogService.createLog(
          AuditLogAction.WORKER_DEAD_DETECTED,
          'Worker',
          worker.id,
          undefined,
          { host: worker.host }
        );
        await this.workerRepository.update(worker.id, { status: 'dead' });
        await this.jobRepository.update(
          { workerId: worker.id, status: JobStatus.PROCESSING },
          { status: JobStatus.PENDING, workerId: null as any },
        );
      }
    }
  }
}
