import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Donor } from '@lardosanjos/database';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CurrentDonor } from './decorators/current-donor.decorator';
import { DonorGuard } from './guards/donor.guard';
import { DonorService } from './donor.service';
import { DonorSubscriptionService } from './donor-subscription.service';
import { DonorCardService } from './donor-card.service';
import { UpdateDonorProfileDto } from './dto/donor-profile.dto';
import { UpdateDonorPrivacyDto } from './dto/donor-privacy.dto';
import {
  CancelDonorSubscriptionDto,
  PauseDonorSubscriptionDto,
  UpdateDonorPaymentMethodDto,
  UpdateDonorSubscriptionDto,
} from './dto/donor-subscription.dto';

@Controller('donor')
@UseGuards(JwtAuthGuard, DonorGuard)
export class DonorController {
  constructor(
    private readonly donorService: DonorService,
    private readonly subscriptionService: DonorSubscriptionService,
    private readonly cardService: DonorCardService,
  ) {}

  @Get('profile')
  getProfile(@CurrentDonor() donor: Donor) {
    return this.donorService.getProfile(donor);
  }

  @Put('profile')
  updateProfilePut(
    @CurrentDonor() donor: Donor,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateDonorProfileDto,
    @Req() req: FastifyRequest,
  ) {
    return this.donorService.updateProfile(donor, dto, user.id, req.ip);
  }

  @Patch('profile')
  updateProfile(
    @CurrentDonor() donor: Donor,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateDonorProfileDto,
    @Req() req: FastifyRequest,
  ) {
    return this.donorService.updateProfile(donor, dto, user.id, req.ip);
  }

  @Get('donations')
  listDonations(@CurrentDonor() donor: Donor) {
    return this.donorService.listDonations(donor);
  }

  @Get('impact')
  getImpact(@CurrentDonor() donor: Donor) {
    return this.donorService.getImpact(donor);
  }

  @Put('privacy-preferences')
  updatePrivacy(
    @CurrentDonor() donor: Donor,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateDonorPrivacyDto,
    @Req() req: FastifyRequest,
  ) {
    return this.donorService.updatePrivacyPreferences(
      donor,
      dto,
      user.id,
      req.ip,
    );
  }

  @Get('subscription')
  getSubscription(@CurrentDonor() donor: Donor) {
    return this.subscriptionService.getSubscription(donor);
  }

  @Post('subscription/change-plan')
  changePlan(
    @CurrentDonor() donor: Donor,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateDonorSubscriptionDto,
    @Req() req: FastifyRequest,
  ) {
    return this.subscriptionService.updatePlan(donor, dto, user.id, req.ip);
  }

  @Patch('subscription')
  updateSubscriptionLegacy(
    @CurrentDonor() donor: Donor,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateDonorSubscriptionDto,
    @Req() req: FastifyRequest,
  ) {
    return this.subscriptionService.updatePlan(donor, dto, user.id, req.ip);
  }

  @Post('subscription/update-payment')
  updatePayment(
    @CurrentDonor() donor: Donor,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateDonorPaymentMethodDto,
    @Req() req: FastifyRequest,
  ) {
    return this.subscriptionService.updatePaymentMethod(
      donor,
      dto,
      user.id,
      req.ip,
    );
  }

  @Put('subscription/payment-method')
  updatePaymentLegacy(
    @CurrentDonor() donor: Donor,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateDonorPaymentMethodDto,
    @Req() req: FastifyRequest,
  ) {
    return this.subscriptionService.updatePaymentMethod(
      donor,
      dto,
      user.id,
      req.ip,
    );
  }

  @Post('subscription/pause')
  pauseSubscription(
    @CurrentDonor() donor: Donor,
    @CurrentUser() user: AuthUser,
    @Body() dto: PauseDonorSubscriptionDto,
    @Req() req: FastifyRequest,
  ) {
    return this.subscriptionService.pause(donor, dto, user.id, req.ip);
  }

  @Post('subscription/cancel')
  cancelSubscription(
    @CurrentDonor() donor: Donor,
    @CurrentUser() user: AuthUser,
    @Body() dto: CancelDonorSubscriptionDto,
    @Req() req: FastifyRequest,
  ) {
    return this.subscriptionService.cancel(donor, dto, user.id, req.ip);
  }

  @Get('card')
  async getCard(@CurrentDonor() donor: Donor) {
    const card = await this.cardService.getCardForDonor(donor.id);
    if (!card) {
      return {
        card: null,
        message:
          'Carteirinha disponível para assinantes mensais. Assine em /seja-um-anjo ou gere após confirmação da assinatura.',
      };
    }
    return { card };
  }

  @Post('card/generate')
  async generateCard(
    @CurrentDonor() donor: Donor,
    @CurrentUser() user: AuthUser,
    @Req() req: FastifyRequest,
  ) {
    const card = await this.cardService.generateCard(donor.id, user.id, req.ip);
    return { card };
  }

  @Get('card/download/png')
  async downloadCardQrPng(
    @CurrentDonor() donor: Donor,
    @Res() reply: FastifyReply,
  ) {
    const buffer = await this.cardService.getQrPngBuffer(donor.id);
    reply
      .header('Content-Type', 'image/png')
      .header(
        'Content-Disposition',
        'attachment; filename="carteirinha-qrcode.png"',
      );
    return reply.send(buffer);
  }
}
