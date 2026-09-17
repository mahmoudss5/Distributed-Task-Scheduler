import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import { AllJobsDto } from '../Dtos/allJobs.dto';

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

    const newJob = this.jobRepository.create({
      ...job,
      userId,
      runAt: job.runAt ?? job.executeAt ?? new Date(),
      retryCount: job.retryCount ?? 3,
      attemptCount: 0,
      isCanceled: false,
    });
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

  async deleteJob(id: string, userId?: string): Promise<{ deleted: boolean }> {
    const where: any = { id };
    if (userId) where.userId = userId;
    const job = await this.jobRepository.findOne({ where });
    if (!job) return { deleted: false };
    if (job.status === JobStatus.PROCESSING) {
      throw new BadRequestException('Cannot delete a processing job');
    }
    const result = await this.jobRepository.delete(where);
    if ((result.affected ?? 0) > 0) {
      this.eventsGateway.broadcastJobStatusChanged();
      this.eventsGateway.broadcastStatsUpdate();
      return { deleted: true };
    }
    return { deleted: false };
  }
  async updateJobStatus(id: string, status: JobStatus): Promise<void> {
    await this.jobRepository.update(id, { status });
    this.eventsGateway.broadcastJobStatusChanged();
    this.eventsGateway.broadcastStatsUpdate();
  }
  async updateJobWorker(id: string, workerId: string): Promise<void> {
    await this.jobRepository.update(id, { workerId });
  }

  async updateJobRetryDelay(
    id: string,
    power: number,
    workerId?: string,
  ): Promise<void> {
    const where: any = { id, status: JobStatus.PROCESSING };
    if (workerId) where.workerId = workerId;
    const job = await this.jobRepository.findOne({ where });
    if (job) {
      const nextDate = new Date();
      nextDate.setMinutes(nextDate.getMinutes() + 2 ** power);
      job.runAt = nextDate;
      job.status = JobStatus.PENDING;
      job.retryCount = Math.max(0, job.retryCount - 1);
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

  async claimJob(jobId: string, workerId: string): Promise<boolean> {
    const result = await this.jobRepository
      .createQueryBuilder()
      .update(Job)
      .set({
        status: JobStatus.PROCESSING,
        workerId,
        attemptCount: () => 'attemptCount + 1',
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
      retryCount: 3,
      runAt: nextRun,
      status: JobStatus.PENDING,
    });

    return newJob;
  }

  async executeJob(currentJob: Job): Promise<void> {
    const type = currentJob.type;
    if (type === JobType.sendEmail) {
      await this.emailService.sendEmail(
        currentJob.jobPayload.to,
        currentJob.jobPayload.subject,
        currentJob.jobPayload.body,
      );
    }
    if (type === JobType.generateReport) {
      const userId =
        typeof currentJob.jobPayload === 'string'
          ? currentJob.jobPayload
          : currentJob.jobPayload.userId;
      await this.reportService.generatePdfReport(userId);
    }
  }

  async cancelJob(id: string, userId?: string): Promise<void> {
    const job = await this.getJobById(id);
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    const isOwner = userId ? job.userId === userId : true;
    if (!isOwner) {
      throw new BadRequestException(
        'You are not authorized to cancel this job',
      );
    }
    if (job.status !== JobStatus.PENDING) {
      throw new BadRequestException('Only pending jobs can be canceled');
    }
    job.status = JobStatus.CANCELED;
    job.isCanceled = true;
    job.canceledAt = new Date();
    const result = await this.jobRepository.update(
      { id, userId: job.userId, status: JobStatus.PENDING },
      { status: JobStatus.CANCELED, isCanceled: true, canceledAt: new Date() },
    );
    if (result.affected !== 1) {
      throw new BadRequestException('Job is no longer pending');
    }
    this.eventsGateway.broadcastJobStatusChanged();
    this.eventsGateway.broadcastStatsUpdate();
  }

  async isCanceled(id: string): Promise<boolean> {
    const job = await this.getJobById(id);
    return !job || job.isCanceled;
  }

  async getAllJobs(): Promise<AllJobsDto> {
    const high = await this.jobRepository.count({
      where: { priorityLevel: JobPriorityLevel.HIGH },
    });
    const medium = await this.jobRepository.count({
      where: { priorityLevel: JobPriorityLevel.MEDIUM },
    });
    const low = await this.jobRepository.count({
      where: { priorityLevel: JobPriorityLevel.LOW },
    });

    return { high, medium, low };
  }
}
