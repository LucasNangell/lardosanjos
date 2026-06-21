import { Controller, Get, Param, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/decorators/auth.decorators';
import { TransparencyService } from './transparency.service';
import { DonorCardService } from '../donor/donor-card.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('public')
export class PublicController {
  constructor(
    private readonly transparencyService: TransparencyService,
    private readonly donorCardService: DonorCardService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Get('plans')
  getPlans() {
    return this.prisma.donationPlan.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  @Public()
  @Get('transparency')
  getTransparency() {
    return this.transparencyService.getSummary();
  }

  @Public()
  @Get('transparency/expenses')
  getTransparencyExpenses() {
    return this.transparencyService.getPublicExpenses();
  }

  @Public()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Get('cards/:cardNumber')
  validateCard(
    @Param('cardNumber') cardNumber: string,
    @Query('t') token?: string,
  ) {
    return this.donorCardService.validateCard(
      decodeURIComponent(cardNumber),
      token,
    );
  }

  /** @deprecated use GET /public/cards/:cardNumber?t= */
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Get('cards/validate/:cardNumber')
  validateCardLegacy(
    @Param('cardNumber') cardNumber: string,
    @Query('t') token?: string,
  ) {
    return this.donorCardService.validateCard(
      decodeURIComponent(cardNumber),
      token,
    );
  }
}
