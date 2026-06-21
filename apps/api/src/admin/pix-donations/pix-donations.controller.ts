import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { FinancialMfaGuard } from '../../auth/guards/financial-mfa.guard';
import { RequirePermissions } from '../../auth/decorators/auth.decorators';
import { RequireFinancialMfa } from '../../auth/decorators/financial-mfa.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthUser } from '../../auth/interfaces/auth-user.interface';
import { PixDonationsService } from './pix-donations.service';
import { ListPixDonationsQueryDto, PixDonationActionDto } from './pix-donations.dto';

@Controller('admin/pix')
@UseGuards(JwtAuthGuard, PermissionsGuard, FinancialMfaGuard)
export class PixDonationsController {
  constructor(private readonly pixDonationsService: PixDonationsService) {}

  @Get('donations')
  @RequirePermissions('PIX_CONFIRM_MANUAL', 'FINANCE_READ')
  list(@Query() query: ListPixDonationsQueryDto) {
    return this.pixDonationsService.list(query);
  }

  @Get('donations/:id')
  @RequirePermissions('PIX_CONFIRM_MANUAL', 'FINANCE_READ')
  getById(@Param('id') id: string) {
    return this.pixDonationsService.getById(id);
  }

  @Get('donations/:id/receipt-url')
  @RequirePermissions('PIX_CONFIRM_MANUAL', 'FINANCE_READ')
  async getReceiptUrl(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.pixDonationsService.getReceiptAccessUrl(id, user.id);
  }

  @Post('donations/:id/confirm')
  @RequirePermissions('PIX_CONFIRM_MANUAL')
  @RequireFinancialMfa()
  confirm(
    @Param('id') id: string,
    @Body() dto: PixDonationActionDto,
    @CurrentUser() user: AuthUser,
    @Req() req: FastifyRequest,
  ) {
    return this.pixDonationsService.confirm(id, user.id, dto, req.ip);
  }

  @Post('donations/:id/reject')
  @RequirePermissions('PIX_CONFIRM_MANUAL')
  @RequireFinancialMfa()
  reject(
    @Param('id') id: string,
    @Body() dto: PixDonationActionDto,
    @CurrentUser() user: AuthUser,
    @Req() req: FastifyRequest,
  ) {
    return this.pixDonationsService.reject(id, user.id, dto, req.ip);
  }

  @Post('donations/:id/mark-duplicate')
  @RequirePermissions('PIX_CONFIRM_MANUAL')
  @RequireFinancialMfa()
  markDuplicate(
    @Param('id') id: string,
    @Body() dto: PixDonationActionDto,
    @CurrentUser() user: AuthUser,
    @Req() req: FastifyRequest,
  ) {
    return this.pixDonationsService.markDuplicate(id, user.id, dto, req.ip);
  }

  @Post('donations/:id/request-info')
  @RequirePermissions('PIX_CONFIRM_MANUAL')
  requestInfo(
    @Param('id') id: string,
    @Body() dto: PixDonationActionDto,
    @CurrentUser() user: AuthUser,
    @Req() req: FastifyRequest,
  ) {
    return this.pixDonationsService.requestInfo(id, user.id, dto, req.ip);
  }
}
