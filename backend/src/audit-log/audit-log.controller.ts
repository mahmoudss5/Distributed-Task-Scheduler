import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @Roles(Role.ADMIN) // Only admins can view all audit logs
  async getAllLogs(@Query() query: PaginationQueryDto) {
    return this.auditLogService.findAll(query.page || 1, query.limit || 10);
  }

  @Get('/userLogs/:id')
  @Roles(Role.ADMIN)
  async getAllLogsByUserId(
    @Param('id') userId: string,
    @Query() query: PaginationQueryDto
  ) {
    return this.auditLogService.findByUser(userId, query.page || 1, query.limit || 10);
  }
}
