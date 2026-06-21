import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/auth.decorators';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthUser } from '../../auth/interfaces/auth-user.interface';
import { ExpensesService } from './expenses.service';
import { CloseTransparencyReportDto } from './expenses.dto';

@Controller('admin/transparency/reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TransparencyReportsController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  @RequirePermissions('FINANCE_READ', 'TRANSPARENCY_READ')
  list() {
    return this.expensesService.listTransparencyReports();
  }

  @Post('close')
  @RequirePermissions('TRANSPARENCY_WRITE')
  closeReport(
    @Body() dto: CloseTransparencyReportDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.expensesService.closeTransparencyReport(dto, user.id);
  }

  @Patch(':id/publish')
  @RequirePermissions('TRANSPARENCY_WRITE')
  publish(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.expensesService.publishReport(id, user.id);
  }

  @Patch(':id/unpublish')
  @RequirePermissions('TRANSPARENCY_WRITE')
  unpublish(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.expensesService.unpublishReport(id, user.id);
  }

  @Get(':id/export')
  @RequirePermissions('FINANCE_READ', 'TRANSPARENCY_READ')
  async export(@Param('id') id: string, @Res() reply: FastifyReply) {
    const report = await this.expensesService.exportReportText(id);
    reply.header('Content-Type', 'text/plain; charset=utf-8');
    reply.header(
      'Content-Disposition',
      `attachment; filename="${report.filename}"`,
    );
    return reply.send(report.content);
  }
}
