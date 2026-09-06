import { Injectable, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { Interval } from '@nestjs/schedule';
import { Repository } from 'typeorm';
import { JobStatus } from '../jobs/entites/job-status.enum';
import { Job } from '../jobs/entites/job.entity';
import { JobsServiceService } from '../jobs/jobs-service/jobs-service.service';
import { of } from 'rxjs';

@Injectable()
export class SchedulerService {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaClient: ClientKafka,
    private readonly jobsService: JobsServiceService,
  ) {}

  // This will execute every 20 seconds (20,000 milliseconds)
  @Interval(20000)
  async scheduleJob(): Promise<void> {
    let jobList: Job[] = await this.jobsService.findAllPendingJobs();
    for (const job of jobList) {
      this.kafkaClient.emit('job-ready', {
        jobId: job.id,
        jobData: job.jobPayload,
      });
      await this.jobsService.updateJobStatus(job.id, JobStatus.PROCESSING);
    }
  }
}
