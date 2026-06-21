import { Module } from '@nestjs/common';
import { MuralService } from './mural.service';
import { MuralPublicController } from './mural.controller';
import { MuralAdminController } from './mural-admin.controller';

@Module({
  controllers: [MuralPublicController, MuralAdminController],
  providers: [MuralService],
  exports: [MuralService],
})
export class MuralModule {}
