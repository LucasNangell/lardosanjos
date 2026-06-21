import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { TransparencyService } from './transparency.service';
import { DonorModule } from '../donor/donor.module';

@Module({
  imports: [DonorModule],
  controllers: [PublicController],
  providers: [TransparencyService],
})
export class PublicModule {}
