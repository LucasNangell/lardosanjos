import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { PixSettingsController } from './pix-settings.controller';
import { PixSettingsService } from './pix-settings.service';
import { PixEmvService } from '../../donations/pix/pix-emv.service';

@Module({
  imports: [AuthModule],
  controllers: [PixSettingsController],
  providers: [PixSettingsService, PixEmvService],
})
export class PixSettingsModule {}
