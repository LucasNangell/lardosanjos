import { Module } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { CampaignDonationsService } from './campaign-donations.service';
import { CampaignsAdminController } from './campaigns-admin.controller';
import { CampaignsPublicController } from './campaigns-public.controller';

@Module({
  controllers: [CampaignsAdminController, CampaignsPublicController],
  providers: [CampaignsService, CampaignDonationsService],
  exports: [CampaignsService, CampaignDonationsService],
})
export class CampaignsModule {}
