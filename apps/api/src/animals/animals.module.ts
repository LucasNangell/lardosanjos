import { Module } from '@nestjs/common';
import { AnimalsService } from './animals.service';
import { AnimalsAdminController } from './animals-admin.controller';
import { AnimalsPublicController } from './animals-public.controller';

@Module({
  controllers: [AnimalsAdminController, AnimalsPublicController],
  providers: [AnimalsService],
  exports: [AnimalsService],
})
export class AnimalsModule {}
