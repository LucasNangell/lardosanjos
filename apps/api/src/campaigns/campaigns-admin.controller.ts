import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/auth.decorators';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CampaignsService } from './campaigns.service';
import { CampaignDonationsService } from './campaign-donations.service';
import { CreateCampaignDto, UpdateCampaignDto } from './campaigns.dto';

@Controller('admin/campaigns')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CampaignsAdminController {
  constructor(
    private readonly campaignsService: CampaignsService,
    private readonly campaignDonationsService: CampaignDonationsService,
  ) {}

  @Get()
  @RequirePermissions('CAMPAIGN_READ')
  findAll() {
    return this.campaignsService.findAllAdmin();
  }

  @Post('images/upload')
  @RequirePermissions('CAMPAIGN_WRITE')
  async uploadImage(@Req() req: FastifyRequest, @CurrentUser() user: AuthUser) {
    const file = await req.file();
    if (!file) throw new BadRequestException('Nenhum arquivo enviado');
    const buffer = await file.toBuffer();
    return this.campaignsService.uploadCoverImage(buffer, file.mimetype, user.id);
  }

  @Get(':id/progress')
  @RequirePermissions('CAMPAIGN_READ')
  progress(@Param('id') id: string) {
    return this.campaignsService.getProgress(id);
  }

  @Get(':id')
  @RequirePermissions('CAMPAIGN_READ')
  findOne(@Param('id') id: string) {
    return this.campaignsService.findOneAdmin(id);
  }

  @Post()
  @RequirePermissions('CAMPAIGN_WRITE')
  create(@Body() dto: CreateCampaignDto, @CurrentUser() user: AuthUser) {
    return this.campaignsService.create(dto, user.id);
  }

  @Post(':id/link-donation')
  @RequirePermissions('CAMPAIGN_WRITE')
  linkDonation(
    @Param('id') id: string,
    @Body() body: { payment_id?: string; pix_donation_id?: string },
  ) {
    return this.campaignDonationsService.manualLink(id, {
      paymentId: body.payment_id,
      pixDonationId: body.pix_donation_id,
    });
  }

  @Patch(':id')
  @RequirePermissions('CAMPAIGN_WRITE')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCampaignDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.campaignsService.update(id, dto, user.id);
  }

  @Delete(':id')
  @RequirePermissions('CAMPAIGN_WRITE')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.campaignsService.remove(id, user.id);
  }
}
