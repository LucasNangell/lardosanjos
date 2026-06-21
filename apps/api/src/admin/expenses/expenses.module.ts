import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import {
  ExpenseCategoriesController,
  ExpensesController,
} from './expenses.controller';
import { TransparencyReportsController } from './transparency-reports.controller';
import { ExpenseReceiptController } from './expense-receipt.controller';
import { FinanceController } from './finance.controller';
import { ExpensesService } from './expenses.service';
import { AsaasModule } from '../../integrations/asaas/asaas.module';

@Module({
  imports: [AuthModule, AsaasModule],
  controllers: [
    ExpenseCategoriesController,
    ExpensesController,
    TransparencyReportsController,
    ExpenseReceiptController,
    FinanceController,
  ],
  providers: [ExpensesService],
})
export class ExpensesModule {}
