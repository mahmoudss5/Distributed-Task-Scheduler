import { Module } from '@nestjs/common';
import { JobsServiceService } from './jobs-service/jobs-service.service';
import { JobsControllerController } from './jobs-controller/jobs-controller.controller';
import { WorkerService } from './workerService/workerService.service';

@Module({
  providers: [JobsServiceService, WorkerService],
  controllers: [JobsControllerController]
})
export class JobsModule {}
