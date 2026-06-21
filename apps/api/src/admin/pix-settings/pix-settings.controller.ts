import {
  Body,
  Controller,
  Get,
  Post,
  Put,
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
import { PixSettingsService } from './pix-settings.service';
import { TestPixSettingsDto, UpdatePixSettingsDto } from './pix-settings.dto';

@Controller('admin/pix/settings')
@UseGuards(JwtAuthGuard, PermissionsGuard, FinancialMfaGuard)
export class PixSettingsController {
  constructor(private readonly pixSettingsService: PixSettingsService) {}

  @Get()
  @RequirePermissions('PIX_SETTINGS_READ')
  getSettings(@CurrentUser() user: AuthUser, @Req() req: FastifyRequest) {
    const canWrite = user.permissions.includes('PIX_SETTINGS_WRITE');
    return this.pixSettingsService.getSettings(user.id, canWrite, req.ip);
  }

  @Put()
  @RequirePermissions('PIX_SETTINGS_WRITE')
  @RequireFinancialMfa()
  updateSettings(
    @Body() dto: UpdatePixSettingsDto,
    @CurrentUser() user: AuthUser,
    @Req() req: FastifyRequest,
  ) {
    return this.pixSettingsService.updateSettings(dto, user.id, req.ip);
  }

  @Post('test')
  @RequirePermissions('PIX_SETTINGS_WRITE')
  testSettings(@Body() dto: TestPixSettingsDto) {
    return this.pixSettingsService.testSettings(dto);
  }
}
