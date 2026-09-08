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
import { LeaderElectionService } from "./LeaderElectionService";

@Injectable()
export class SchedulerService {
    constructor(
        @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
        private readonly redisService: RedisService,
        private readonly jobsService: JobsServiceService,
        @InjectRepository(Worker) private readonly workerRepository: Repository<Worker>,
        @InjectRepository(Job) private readonly jobRepository: Repository<Job>,
        private readonly leaderElectionService: LeaderElectionService
    ) {
    }

    @Interval(20000)
    async scheduleJob(): Promise<void> {
        if (!this.leaderElectionService.amILeader()) {
            return;
        }
        let jobList: Job[] = await this.jobsService.findAllPendingJobs();
        for (const job of jobList) {
            if (job.runAt > new Date()) {
                continue;
            }
            this.kafkaClient.emit('job-ready', {
                jobId: job.id,
                jobData: job.jobPayload,
            });
            await this.jobsService.updateJobStatus(job.id, JobStatus.PROCESSING);
        }
    }

    @Interval(30000)
    async checkDeadWorkeres(): Promise<void> {
        const activeWrokers: Worker[] = await this.workerRepository.find({ where: { status: 'active' } });
        for (const worker of activeWrokers) {
            const isAlive = await this.redisService.get(`worker:${worker.id}:heartbeat`);
            if (!isAlive) {
                await this.workerRepository.update(worker.id, { status: 'dead' });
                await this.jobRepository.update(
                    { workerId: worker.id, status: JobStatus.PROCESSING },
                    { status: JobStatus.PENDING, workerId: null as any },
                );
            }
        }
    }
}
