import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';
import { Job } from '../jobs/entites/job.entity';
import { JobStatus } from '../jobs/entites/job-status.enum';
import { Worker } from '../worker/entities/worker.entity';

interface DashboardWorker extends Worker {
  jobsProcessed: number;
}

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
  async getWorkers(@CurrentUser() user: { id: string }): Promise<DashboardWorker[]> {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const [workerRecords, completedJobs] = await Promise.all([
      this.workerRepository.find({ order: { lastHeartbeat: 'DESC' } }),
      this.jobRepository
        .createQueryBuilder('job')
        .select('job.workerId', 'workerId')
        .addSelect('COUNT(*)', 'jobsProcessed')
        .where('job.userId = :userId', { userId: user.id })
        .andWhere('job.status = :status', { status: JobStatus.COMPLETED })
        .andWhere('job.workerId IS NOT NULL')
        .groupBy('job.workerId')
        .getRawMany<{ workerId: string; jobsProcessed: string }>(),
    ]);
    // A restarted container used to create a new UUID and leave its previous
    // row in the table. The API should expose one current record per host,
    // otherwise the dashboard counts historical restarts as worker nodes.
    const latestWorkerByHost = new Map<string, Worker>();
    for (const worker of workerRecords) {
      if (!latestWorkerByHost.has(worker.host)) {
        latestWorkerByHost.set(worker.host, worker);
      }
    }
    const workers = [...latestWorkerByHost.values()];
    const processedByWorker = new Map(
      completedJobs.map((job) => [job.workerId, Number(job.jobsProcessed)]),
    );

    return workers.map((worker) => ({
      ...worker,
      status:
        worker.status === 'active' && worker.lastHeartbeat >= twoMinutesAgo
          ? 'active'
          : 'dead',
      jobsProcessed: processedByWorker.get(worker.id) ?? 0,
    }));
  }
}
