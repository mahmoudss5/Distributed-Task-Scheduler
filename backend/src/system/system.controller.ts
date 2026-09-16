import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { Job } from '../jobs/entites/job.entity';
import { JobStatus } from '../jobs/entites/job-status.enum';
import { Worker } from '../worker/entities/worker.entity';

@Controller()
@UseGuards(JwtAuthGuard)
export class SystemController {
  constructor(
    @InjectRepository(Job) private readonly jobRepository: Repository<Job>,
    @InjectRepository(Worker) private readonly workerRepository: Repository<Worker>,
  ) {}

  @Get('stats')
  async getStats(@CurrentUser() user: { id: string }) {
    const [completed, running, pending, failed] = await Promise.all([
      this.jobRepository.count({ where: { userId: user.id, status: JobStatus.COMPLETED } }),
      this.jobRepository.count({ where: { userId: user.id, status: JobStatus.PROCESSING } }),
      this.jobRepository.count({ where: { userId: user.id, status: JobStatus.PENDING } }),
      this.jobRepository.count({ where: { userId: user.id, status: JobStatus.FAILED } }),
    ]);
    return { completed, running, pending, failed };
  }

  @Get('workers')
  async getWorkers(): Promise<Worker[]> {
    return this.workerRepository.find({ order: { lastHeartbeat: 'DESC' } });
  }
}
