import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AuditLogDto } from './entities/AuditLogDto';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async createLog(
    action: string,
    entityName: string,
    entityId: string,
    userId?: string,
    details?: Record<string, any>,
  ): Promise<AuditLog> {
    const newLog = this.auditLogRepository.create({
      action,
      entityName,
      entityId,
      userId,
      details,
    });
    return this.auditLogRepository.save(newLog);
  }

  async findAll(): Promise<AuditLogDto[]> {
    let allLogs=await this.auditLogRepository.find();
    return allLogs.map(log => this.toDto(log));
  }

  async findByEntity(entityName: string, entityId: string): Promise<AuditLogDto[]> {
    let allLogs=await this.auditLogRepository.find({
      where: { entityName, entityId },
      order: { createdAt: 'DESC' },
    });
    return allLogs.map(log => this.toDto(log));
  }
  async findByUser(userId: string): Promise<AuditLogDto[]> {
    let allLogs=await this.auditLogRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return allLogs.map(log => this.toDto(log));
  }


  toDto(AuditLog:AuditLog): AuditLogDto {
    const { action, entityName, details, createdAt } = AuditLog;
    return { action, entityName, details, createdAt };
  }

}
