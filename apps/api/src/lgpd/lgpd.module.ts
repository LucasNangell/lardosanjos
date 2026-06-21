import { Module } from '@nestjs/common';
import { LgpdService } from './lgpd.service';
import { LgpdController } from './lgpd.controller';

@Module({
  controllers: [LgpdController],
  providers: [LgpdService],
})
export class LgpdModule {}
