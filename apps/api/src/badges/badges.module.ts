import { Module } from '@nestjs/common';
import { BadgesService } from './badges.service';
import { BadgesAdminController } from './badges-admin.controller';

@Module({
  controllers: [BadgesAdminController],
  providers: [BadgesService],
  exports: [BadgesService],
})
export class BadgesModule {}
