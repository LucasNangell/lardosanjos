import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/auth.decorators';
import { ExpensesService } from './expenses.service';

@Controller('admin/finance')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FinanceController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get('dashboard')
  @RequirePermissions('FINANCE_READ')
  dashboard() {
    return this.expensesService.getFinanceDashboard();
  }

  @Get('asaas-reconciliation')
  @RequirePermissions('FINANCE_READ')
  asaasReconciliation(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
  ) {
    return this.expensesService.reconcileAsaas({
      from,
      to,
      limit: limit ? Number(limit) : undefined,
    });
  }
}
