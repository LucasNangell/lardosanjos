import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../auth/decorators/auth.decorators';
import { OnetimeDonationDto } from './onetime.dto';
import { OnetimeService } from './onetime.service';

@Controller('public/donations/onetime')
export class OnetimeController {
  constructor(private readonly onetimeService: OnetimeService) {}

  @Public()
  @Post()
  @HttpCode(201)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  create(@Body() dto: OnetimeDonationDto) {
    return this.onetimeService.create(dto);
  }
}
