import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AuditLogService } from './audit-log.service';
import { AuditLogController } from './audit-log.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  controllers: [AuditLogController],
  providers: [AuditLogService],
  exports: [AuditLogService], // Exported in case other modules want to create logs
})
export class AuditLogModule {}
