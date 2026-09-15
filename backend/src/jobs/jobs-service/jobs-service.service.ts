import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from '../entites/job.entity';
import { Repository } from 'typeorm';
import { JobCreationResponse } from '../Dtos/jobCreationResponse';
import { JobStatus } from '../entites/job-status.enum';
import { JobPriorityLevel } from '../entites/job-priority-level.enum';
import { EventsGateway } from '../../events/events.gateway';
import { PaginatedResponse } from '../../common/dto/pagination.dto';
import { ReportService } from '../../report/service/report.service';
import { EmailService } from '../../email/service/email.service';
import { JobType } from '../entites/job.type.enum';

@Injectable()
export class JobsServiceService {
  constructor(
    @InjectRepository(Job) private readonly jobRepository: Repository<Job>,
    private readonly eventsGateway: EventsGateway,
    @Inject(forwardRef(() => ReportService))
    private readonly reportService: ReportService,
    @Inject(forwardRef(() => EmailService))
    private readonly emailService: EmailService,
  ) {}

  private convertToResponse(job: Job): JobCreationResponse {
    return {
      id: job.id,
      status: job.status,
    };
  }

  getPriorityNumber(priorityLevel: JobPriorityLevel): number {
    switch (priorityLevel) {
      case JobPriorityLevel.HIGH:
        return 15;
      case JobPriorityLevel.MEDIUM:
        return 10;
      case JobPriorityLevel.LOW:
      default:
        return 5;
    }
  }

  private async paginateJobs(
    where: any,
    page: number,
    limit: number,
    order?: any,
  ): Promise<PaginatedResponse<Job>> {
    const skip = (page - 1) * limit;
    const [data, total] = await this.jobRepository.findAndCount({
      where,
      take: limit,
      skip,
      order,
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  async createJob(
    job: Partial<Job>,
    userId: string,
  ): Promise<JobCreationResponse> {
    // Automatically calculate and set the numerical priority based on the priority level
    const priorityLevel = job.priorityLevel || JobPriorityLevel.LOW;
    job.priority = this.getPriorityNumber(priorityLevel);

    const newJob = this.jobRepository.create({ ...job, userId });
    const savedJob = await this.jobRepository.save(newJob);
    let savedJobResponse = this.convertToResponse(savedJob);

    this.eventsGateway.broadcastJobStatusChanged();
    this.eventsGateway.broadcastStatsUpdate();

    return savedJobResponse;
  }

  async getJobById(id: string, userId?: string): Promise<Job | null> {
    const where: any = { id };
    if (userId) where.userId = userId;
    return await this.jobRepository.findOne({ where });
  }

  async getFailedJobs(
    page: number,
    limit: number,
    userId?: string,
  ): Promise<PaginatedResponse<Job>> {
    const where: any = { status: JobStatus.FAILED };
    if (userId) where.userId = userId;
    return await this.paginateJobs(where, page, limit);
  }

  async getCountOfFailedJobs(userId?: string): Promise<number> {
    const where: any = { status: JobStatus.FAILED };
    if (userId) where.userId = userId;
    return await this.jobRepository.count({ where });
  }

  async findAllPendingJobs(
    page: number,
    limit: number,
    userId?: string,
  ): Promise<PaginatedResponse<Job>> {
    const where: any = { status: JobStatus.PENDING };
    if (userId) where.userId = userId;
    return await this.paginateJobs(where, page, limit, {
      priority: 'DESC',
      createdAt: 'ASC',
    });
  }

  async fetchPendingJobsForScheduler(limit: number = 100): Promise<Job[]> {
    return await this.jobRepository.find({
      where: { status: JobStatus.PENDING },
      take: limit,
      order: {
        priority: 'DESC',
        createdAt: 'ASC',
      },
    });
  }

  async getCountOfPendingJobs(userId?: string): Promise<number> {
    const where: any = { status: JobStatus.PENDING };
    if (userId) where.userId = userId;
    return await this.jobRepository.count({ where });
  }

  async findAllCompletedJobs(
    page: number,
    limit: number,
    userId?: string,
  ): Promise<PaginatedResponse<Job>> {
    const where: any = { status: JobStatus.COMPLETED };
    if (userId) where.userId = userId;
    return await this.paginateJobs(where, page, limit);
  }

  async getCountOfCompletedJobs(userId?: string): Promise<number> {
    const where: any = { status: JobStatus.COMPLETED };
    if (userId) where.userId = userId;
    return await this.jobRepository.count({ where });
  }

  async findAllJobs(
    page: number,
    limit: number,
    userId?: string,
  ): Promise<PaginatedResponse<Job>> {
    const where: any = {};
    if (userId) where.userId = userId;
    return await this.paginateJobs(where, page, limit, {
      createdAt: 'DESC',
    });
  }

  async deleteJob(id: string, userId?: string): Promise<void> {
    const where: any = { id };
    if (userId) where.userId = userId;
    await this.jobRepository.delete(where);
    this.eventsGateway.broadcastJobStatusChanged();
    this.eventsGateway.broadcastStatsUpdate();
  }
  async updateJobStatus(id: string, status: JobStatus): Promise<void> {
    await this.jobRepository.update(id, { status });
    this.eventsGateway.broadcastJobStatusChanged();
    this.eventsGateway.broadcastStatsUpdate();
  }
  async updateJobWorker(id: string, workerId: string): Promise<void> {
    await this.jobRepository.update(id, { workerId });
  }

  async updateJobRetryDelay(id: string, power: number): Promise<void> {
    const job = await this.getJobById(id);
    if (job) {
      const nextDate = new Date();
      nextDate.setMinutes(nextDate.getMinutes() + 2 ** power);
      job.runAt = nextDate;
      await this.jobRepository.save(job);
    }
  }

  async updateJobPriorityLevel(
    id: string,
    priorityLevel: JobPriorityLevel,
  ): Promise<void> {
    const job = await this.getJobById(id);
    if (job) {
      job.priorityLevel = priorityLevel;
      await this.jobRepository.save(job);
    }
  }

  async claimJob(jobId:string): Promise<boolean> {

    const result = await this.jobRepository
      .createQueryBuilder()
      .update(Job)
      .set({
        status: JobStatus.PROCESSING,
      })
      .where('id = :id', { id: jobId })
      .andWhere('status = :status', {
        status: JobStatus.PENDING,
      })
      .execute();

    return result.affected === 1;
  }

  JobCorn(currentJob: Job, nextRun: Date): Job {
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

    return newJob;
  }

  async executeJob(currentJob: Job): Promise<void> {
    const type = currentJob.type;
    if (type === JobType.sendEmail) {
      await this.emailService.sendEmail(currentJob.jobPayload.to, currentJob.jobPayload.subject, currentJob.jobPayload.body);
    }
    if (type === JobType.generateReport) {
      const userId = typeof currentJob.jobPayload === 'string' ? currentJob.jobPayload : currentJob.jobPayload.userId;
      await this.reportService.generatePdfReport(userId);
    }
  }
}
