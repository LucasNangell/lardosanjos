import { Module } from '@nestjs/common';
import { AsaasModule } from '../integrations/asaas/asaas.module';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { BadgesModule } from '../badges/badges.module';
import { DonorsService } from './donors/donors.service';
import { PixModule } from './pix/pix.module';
import { OnetimeService } from './onetime/onetime.service';
import { OnetimeController } from './onetime/onetime.controller';
import { SubscriptionService } from './subscription/subscription.service';
import { SubscriptionController } from './subscription/subscription.controller';

@Module({
  imports: [AsaasModule, CampaignsModule, BadgesModule, PixModule],
  controllers: [OnetimeController, SubscriptionController],
  providers: [DonorsService, OnetimeService, SubscriptionService],
})
export class DonationsModule {}
