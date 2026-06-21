import { Module, forwardRef } from '@nestjs/common';
import { AsaasModule } from '../integrations/asaas/asaas.module';
import { CommonModule } from '../common/common.module';
import { DonorController } from './donor.controller';
import { DonorService } from './donor.service';
import { DonorSubscriptionService } from './donor-subscription.service';
import { DonorCardService } from './donor-card.service';
import { DonorGuard } from './guards/donor.guard';

@Module({
  imports: [forwardRef(() => AsaasModule), CommonModule],
  controllers: [DonorController],
  providers: [
    DonorService,
    DonorSubscriptionService,
    DonorCardService,
    DonorGuard,
  ],
  exports: [DonorCardService, DonorSubscriptionService],
})
export class DonorModule {}
