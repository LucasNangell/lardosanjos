import { Module, forwardRef } from '@nestjs/common';
import { BadgesModule } from '../../badges/badges.module';
import { CampaignsModule } from '../../campaigns/campaigns.module';
import { AsaasService } from './asaas.service';
import { AsaasWebhookController } from './asaas-webhook.controller';
import { AsaasWebhookService } from './asaas-webhook.service';
import { AsaasWebhookProcessor } from './asaas-webhook.processor';
import { DonorModule } from '../../donor/donor.module';

@Module({
  imports: [forwardRef(() => DonorModule), BadgesModule, CampaignsModule],
  controllers: [AsaasWebhookController],
  providers: [AsaasService, AsaasWebhookService, AsaasWebhookProcessor],
  exports: [AsaasService, AsaasWebhookService, AsaasWebhookProcessor],
})
export class AsaasModule {}
