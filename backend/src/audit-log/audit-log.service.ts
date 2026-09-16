import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { AuditLogAction } from './enums/audit-log-action.enum';
import { AuditLogDto } from './entities/AuditLogDto';
import { PaginatedResponse } from '../common/dto/pagination.dto';
import { MoreThanOrEqual } from 'typeorm';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async createLog(
    action: AuditLogAction,
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

  async findAll(page: number = 1, limit: number = 10): Promise<PaginatedResponse<AuditLogDto>> {
    const [data, total] = await this.auditLogRepository.findAndCount({
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });
    return {
      data: data.map(log => this.toDto(log)),
      meta: { total, page, limit },
    };
  }

  async findByEntity(entityName: string, entityId: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<AuditLogDto>> {
    const [data, total] = await this.auditLogRepository.findAndCount({
      where: { entityName, entityId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });
    return {
      data: data.map(log => this.toDto(log)),
      meta: { total, page, limit },
    };
  }

  async findByUser(userId: string, page: number = 1, limit: number = 10): Promise<PaginatedResponse<AuditLogDto>> {
    const [data, total] = await this.auditLogRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });
    return {
      data: data.map(log => this.toDto(log)),
      meta: { total, page, limit },
    };
  }

  async findRecentByUser(userId: string, fromDate: Date): Promise<AuditLogDto[]> {
    const allLogs = await this.auditLogRepository.find({
      where: { userId, createdAt: MoreThanOrEqual(fromDate) },
      order: { createdAt: 'DESC' },
    });
    return allLogs.map(log => this.toDto(log));
  }


  toDto(AuditLog:AuditLog): AuditLogDto {
    const { action, entityName, details, createdAt } = AuditLog;
    return { action, entityName, details, createdAt };
  }

}
