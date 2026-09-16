import { Injectable, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Interval } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from '../jobs/entites/job.entity';
import { JobStatus } from '../jobs/entites/job-status.enum';
import { JobsServiceService } from '../jobs/jobs-service/jobs-service.service';
import { Worker } from '../worker/entities/worker.entity';
import { RedisService } from '../redis/redis.service';
import { LeaderElectionService } from './LeaderElectionService';
import { JobPriorityLevel } from '../jobs/entites/job-priority-level.enum';
import { KafkaLagService } from './kafka-lag.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditLogAction } from '../audit-log/enums/audit-log-action.enum';
import { lastValueFrom } from 'rxjs';

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
    for (const job of jobList) {
      job.priority = job.priority + 2;
      let priorityLevel = job.priorityLevel;
      if (
        job.priority >= 10 &&
        job.priority <= 15 &&
        job.priorityLevel !== JobPriorityLevel.MEDIUM
      ) {
        priorityLevel = JobPriorityLevel.MEDIUM;
      }
      if (job.priority >= 15 && job.priorityLevel !== JobPriorityLevel.HIGH) {
        priorityLevel = JobPriorityLevel.HIGH;
      }
      await this.jobRepository.update(job.id, { priority: job.priority, priorityLevel });
    }
  }


  async checkLag(): Promise<boolean> {
    const lag = await this.kafkaLagService.getConsumerLag(
      'job-ready',
      process.env.KAFKA_GROUP_ID ?? 'taskflow-workers',
    );
    if (lag > 10) {
      await this.auditLogService.createLog(
        AuditLogAction.SCHEDULER_PAUSED,
        'Scheduler',
        'System',
        undefined,
        { lag, reason: 'Kafka consumer lag exceeded threshold of 10' },
      );
      return false;
    }
    return true;
  }

  @Interval(20000)
  async scheduleJob(): Promise<void> {
    // check if this workere is the leader
    if (!(await this.leaderElectionService.ensureLeadership())) {
      return;
    }
    // Check if there are already too many jobs queued up in Kafka (lag > 10)
    if (!(await this.checkLag())) {
      return;
    }
    let jobList: Job[] = await this.jobsService.fetchPendingJobsForScheduler();
    for (const job of jobList) {
      if (!(await this.leaderElectionService.ensureLeadership())) return;
      const scheduledAt = job.runAt ?? job.executeAt;
      if (scheduledAt && scheduledAt > new Date()) {
        continue;
      }
      // check idempotency key
      const key=`job-idempotency-key:${job.id}`;
      if (!(await this.redisService.setNX(key, 'true', 240))) {
        continue;
      }
      try {
        await lastValueFrom(this.kafkaClient.emit('job-ready', {
          jobId: job.id,
          jobData: job.jobPayload,
        }));
      } catch (error) {
        await this.redisService.del(key);
        throw error;
      }
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
