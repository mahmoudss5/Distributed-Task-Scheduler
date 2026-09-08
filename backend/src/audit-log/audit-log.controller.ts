import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('audit-logs')
@UseGuards(RolesGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @Roles(Role.ADMIN) // Only admins can view all audit logs
  async getAllLogs() {
    return this.auditLogService.findAll();
  }

  @Get('/userLogs/:id')
  async getAllLogsByUserId(@Param('id') userId: string) {
    return this.auditLogService.findByUser(userId);
  }
}
