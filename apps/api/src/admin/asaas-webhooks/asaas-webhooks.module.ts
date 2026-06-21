import { Module } from '@nestjs/common';
import { AsaasModule } from '../../integrations/asaas/asaas.module';
import { AsaasWebhooksAdminController } from './asaas-webhooks.controller';

@Module({
  imports: [AsaasModule],
  controllers: [AsaasWebhooksAdminController],
})
export class AsaasWebhooksAdminModule {}
