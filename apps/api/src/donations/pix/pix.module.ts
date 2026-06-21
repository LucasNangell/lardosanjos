import { Module } from '@nestjs/common';
import { CampaignsModule } from '../../campaigns/campaigns.module';
import { PixEmvService } from './pix-emv.service';
import { PixService } from './pix.service';
import { PixController } from './pix.controller';

@Module({
  imports: [CampaignsModule],
  controllers: [PixController],
  providers: [PixEmvService, PixService],
  exports: [PixService, PixEmvService],
})
export class PixModule {}
