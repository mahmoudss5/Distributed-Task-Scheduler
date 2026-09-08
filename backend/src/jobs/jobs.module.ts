import { Module } from '@nestjs/common';
import { JobsServiceService } from './jobs-service/jobs-service.service';
import { JobsControllerController } from './jobs-controller/jobs-controller.controller';

@Module({
  providers: [JobsServiceService],
  controllers: [JobsControllerController]
})
export class JobsModule {}
