import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportService } from './service/report.service';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { Report } from './entities/report.entity';
import { ReportController } from './report.controller';
import { JobsModule } from '../jobs/jobs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Report]),
    AuditLogModule,
    forwardRef(() => JobsModule)
  ],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
