import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/auth.decorators';
import { AuditLogsService } from './audit-logs.service';

@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @RequirePermissions('AUDIT_READ')
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('entity') entity?: string,
    @Query('action') action?: string,
  ) {
    return this.auditLogsService.list({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      entity,
      action,
    });
  }
}
