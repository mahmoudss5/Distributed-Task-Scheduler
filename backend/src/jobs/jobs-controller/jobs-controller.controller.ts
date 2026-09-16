import {
  Controller,
  Inject,
  Get,
  Post,
  Delete,
  Body,
  Param,
  NotFoundException,
  UseGuards,
  Query,
} from '@nestjs/common';
import { JobsServiceService } from '../jobs-service/jobs-service.service';
import { Job } from '../entites/job.entity';
import { JobCreationResponse } from '../Dtos/jobCreationResponse';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { CreateJobDto } from '../Dtos/create-job.dto';
import { PaginationQueryDto, PaginatedResponse } from '../../common/dto/pagination.dto';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';

@UseGuards(JwtAuthGuard)
@Controller('jobs')
export class JobsControllerController {
  constructor(
    @Inject(JobsServiceService)
    private readonly jobsService: JobsServiceService,
  ) {}

  @Post('/create')
  @RateLimit({ limit: 5, windowSeconds: 60, keyPrefix: 'jobs-create' })
  async createJob(
    @Body() createJobDto: CreateJobDto,
    @CurrentUser() user: any,
  ): Promise<JobCreationResponse> {
    return await this.jobsService.createJob(createJobDto, user.id);
  }

  @Get('/completedCount')
  async getCountOfCompletedJobs(@CurrentUser() user: any): Promise<number> {
    return await this.jobsService.getCountOfCompletedJobs(user.id);
  }

  @Get('/pendingCount')
  async getCountOfPendingJobs(@CurrentUser() user: any): Promise<number> {
    return await this.jobsService.getCountOfPendingJobs(user.id);
  }

  @Get('/failedCount')
  async getCountOfFailedJobs(@CurrentUser() user: any): Promise<number> {
    return await this.jobsService.getCountOfFailedJobs(user.id);
  }

  @Get('/failed')
  async getFailedJobs(
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: any,
  ): Promise<PaginatedResponse<Job>> {
    return await this.jobsService.getFailedJobs(query.page || 1, query.limit || 10, user.id);
  }

  @Get('/completed')
  async getCompletedJobs(
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: any,
  ): Promise<PaginatedResponse<Job>> {
    return await this.jobsService.findAllCompletedJobs(query.page || 1, query.limit || 10, user.id);
  }

  @Get('/pending')
  async getPendingJobs(
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: any,
  ): Promise<PaginatedResponse<Job>> {
    return await this.jobsService.findAllPendingJobs(query.page || 1, query.limit || 10, user.id);
  }

  @Get('/my')
  async getMyJobs(
    @Query() query: PaginationQueryDto,
    @CurrentUser() user: any,
  ): Promise<PaginatedResponse<Job>> {
    return await this.jobsService.findAllJobs(query.page || 1, query.limit || 10, user.id);
  }

  @Get('by-id/:id')
  async getJobById(@Param('id') id: string, @CurrentUser() user: any): Promise<Job> {
    const job = await this.jobsService.getJobById(id, user.id);
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Get('/all')
  async getAllJobsForAdmin(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<Job>> {
    // Admin route: fetch jobs for ALL users (userId = undefined)
    return await this.jobsService.findAllJobs(query.page || 1, query.limit || 10);
  }

  @Delete('/delete/:id')
  async deleteJob(@Param('id') id: string, @CurrentUser() user: any): Promise<{ deleted: boolean }> {
    return await this.jobsService.deleteJob(id, user.id);
  }

  @Post('/cancel/:id')
  async cancelJob(@Param('id') id: string, @CurrentUser() user: any): Promise<void> {
    await this.jobsService.cancelJob(id, user.id);
  }
}
