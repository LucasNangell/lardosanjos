import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { StorageModule } from '../../storage/storage.module';
import { BadgesModule } from '../../badges/badges.module';
import { CampaignsModule } from '../../campaigns/campaigns.module';
import { PixDonationsController } from './pix-donations.controller';
import { PixReceiptController } from './pix-receipt.controller';
import { PixDonationsService } from './pix-donations.service';

@Module({
  imports: [AuthModule, StorageModule, BadgesModule, CampaignsModule],
  controllers: [PixDonationsController, PixReceiptController],
  providers: [PixDonationsService],
})
export class PixDonationsModule {}
