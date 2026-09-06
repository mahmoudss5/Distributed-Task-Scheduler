import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Job } from '../entites/job.entity';
import { Repository } from 'typeorm';
import { JobCreationResponse } from '../Dtos/jobCreationResponse';
import { JobStatus } from '../entites/job-status.enum';

@Injectable()
export class JobsServiceService {
 constructor(
    @InjectRepository(Job) private readonly jobRepository: Repository<Job>) {}

   private convertToResponse(job: Job): JobCreationResponse {
    return {
      id: job.id,
      status: job.status,
    };
   }

  async createJob(job: Partial<Job>): Promise<JobCreationResponse> {
    const newJob = this.jobRepository.create(job);
    const savedJob = await this.jobRepository.save(newJob);
    let savedJobResponse=this.convertToResponse(savedJob);
    return await savedJobResponse;
  }

  async getJobById(id: string): Promise<Job | null> {
    return await this.jobRepository.findOne({ where: { id } });
  }

  async getFailedJobs(): Promise<Job[]> {
    return await this.jobRepository.find({ where: { status: JobStatus.FAILED } });
  }
  async getCountOfFailedJobs(): Promise<number> {
    return await this.jobRepository.count({ where: { status: JobStatus.FAILED } });
  }

  async findAllPendingJobs(): Promise<Job[]> {
    return await this.jobRepository.find({ where: { status: JobStatus.PENDING } });
  }
  async getCountOfPendingJobs(): Promise<number> {
    return await this.jobRepository.count({ where: { status: JobStatus.PENDING } });
  }
  async findAllCompletedJobs(): Promise<Job[]> {
    return await this.jobRepository.find({ where: { status: JobStatus.COMPLETED } });
  }
  async getCountOfCompletedJobs(): Promise<number> {
    return await this.jobRepository.count({ where: { status: JobStatus.COMPLETED } });
  }

  async deleteJob(id: string): Promise<void> {
    await this.jobRepository.delete(id);
 }
 async updateJobStatus(id: string, status: JobStatus): Promise<void> {
    await this.jobRepository.update(id, { status });
  }

}
