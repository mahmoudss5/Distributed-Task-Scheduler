import {
  Controller,
  Inject,
  Injectable,
  Get,
  Post,
  Delete,
  Body,
} from '@nestjs/common';
import { JobsServiceService } from '../jobs-service/jobs-service.service';
import { Job } from '../entites/job.entity';
import { JobCreationResponse } from '../Dtos/jobCreationResponse';

@Controller('jobs-controller')
export class JobsControllerController {
  constructor(
    @Inject(JobsServiceService)
    private readonly jobsService: JobsServiceService,
  ) {}

  @Post('/create')
  async createJob(@Body() job: Partial<Job>): Promise<JobCreationResponse> {
    return await this.jobsService.createJob(job);
  }

  @Get('/completedCount')
  async getCountOfCompletedJobs(): Promise<number> {
    return await this.jobsService.getCountOfCompletedJobs()
  }

  @Get('/pendingCount')
  async getCountOfPendingJobs(): Promise<Job[]> {
    return await this.jobsService.findAllPendingJobs();
  }

  @Get('/failedCount')
  async getCountOfFailedJobs(): Promise<number> {
    return await this.jobsService.getCountOfFailedJobs();
  }


  @Get('/failed')
  async getFailedJobs(): Promise<Job[]> {
    return await this.jobsService.getFailedJobs();
  }
  @Get('/completed')
  async getCompletedJobs(): Promise<Job[]> {
    return await this.jobsService.findAllCompletedJobs();
  }
  @Get('/pending')
  async getPendingJobs(): Promise<Job[]> {
    return await this.jobsService.findAllPendingJobs();
  }
  @Get('/all')
  async getAllJobs(): Promise<Job[]> {
    return await this.jobsService.findAllPendingJobs();
  }
  @Delete('/delete/:id')
  async deleteJob(@Body('id') id: string): Promise<void> {
    await this.jobsService.deleteJob(id);
  }
}
