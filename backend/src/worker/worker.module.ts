import { Module } from '@nestjs/common';
import { WorkerService } from './workerService/worker.service';

@Module({
  providers: [WorkerService]
})
export class WorkerModule {}
