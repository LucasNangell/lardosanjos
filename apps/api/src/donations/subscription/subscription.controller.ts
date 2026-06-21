import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../auth/decorators/auth.decorators';
import { SubscriptionDonationDto } from './subscription.dto';
import { SubscriptionService } from './subscription.service';

@Controller('public/donations/subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Public()
  @Post()
  @HttpCode(201)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  create(@Body() dto: SubscriptionDonationDto) {
    return this.subscriptionService.create(dto);
  }
}
