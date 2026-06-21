import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/auth.decorators';
import { LgpdService } from './lgpd.service';
import { ConsentDto, DataRequestDto } from './lgpd.dto';

@Controller('public/lgpd')
export class LgpdController {
  constructor(private readonly lgpdService: LgpdService) {}

  @Public()
  @Post('consent')
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  recordConsent(@Body() dto: ConsentDto) {
    return this.lgpdService.recordConsent(dto);
  }

  @Public()
  @Post('data-export-request')
  @HttpCode(202)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  requestExport(@Body() dto: DataRequestDto) {
    return this.lgpdService.requestDataExport(dto);
  }

  @Public()
  @Post('data-deletion-request')
  @HttpCode(202)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  requestDeletion(@Body() dto: DataRequestDto) {
    return this.lgpdService.requestDataDeletion(dto);
  }
}
