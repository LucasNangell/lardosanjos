import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { PixSettingsModule } from './pix-settings/pix-settings.module';
import { PixDonationsModule } from './pix-donations/pix-donations.module';
import { ExpensesModule } from './expenses/expenses.module';
import { AsaasWebhooksAdminModule } from './asaas-webhooks/asaas-webhooks.module';
import { AdminUsersModule } from './admin-users/admin-users.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';

@Module({
  imports: [
    PixSettingsModule,
    PixDonationsModule,
    ExpensesModule,
    AsaasWebhooksAdminModule,
    AdminUsersModule,
    AuditLogsModule,
  ],
  controllers: [AdminController],
})
export class AdminModule {}
