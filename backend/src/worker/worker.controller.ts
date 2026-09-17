import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { WorkerService } from './workerService/worker.service';

interface JobReadyEvent {
  jobId: string;
  jobData?: unknown;
}

@Controller()
export class WorkerController {
  constructor(private readonly workerService: WorkerService) {}

  @EventPattern('job-ready')
  async handleJobReady(event: JobReadyEvent): Promise<void> {
    await this.workerService.handleJobReadyMessage(event);
  }
}
