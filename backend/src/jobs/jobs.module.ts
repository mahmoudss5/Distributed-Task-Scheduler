import { Module, forwardRef } from '@nestjs/common';
import { JobsServiceService } from './jobs-service/jobs-service.service';
import { JobsControllerController } from './jobs-controller/jobs-controller.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from './entites/job.entity';
import { ReportModule } from '../report/report.module';
import { EmailModule } from '../email/email.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job]),
    EventsModule,
    forwardRef(() => ReportModule),
    forwardRef(() => EmailModule),
  ],
  providers: [JobsServiceService],
  controllers: [JobsControllerController],
  exports: [JobsServiceService]
})
export class JobsModule {}
