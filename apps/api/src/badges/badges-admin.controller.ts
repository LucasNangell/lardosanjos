import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/auth.decorators';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { BadgesService } from './badges.service';

@Controller('admin/badges')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BadgesAdminController {
  constructor(private readonly badgesService: BadgesService) {}

  @Get()
  @RequirePermissions('BADGE_READ')
  list() {
    return this.badgesService.listBadges();
  }

  @Get('donors/:donorId')
  @RequirePermissions('BADGE_READ')
  donorBadges(@Param('donorId') donorId: string) {
    return this.badgesService.listDonorBadges(donorId);
  }

  @Post('sync')
  @RequirePermissions('BADGE_WRITE')
  sync(@CurrentUser() user: AuthUser) {
    return this.badgesService.syncAllDonors(user.id);
  }

  @Post(':badgeId/award/:donorId')
  @RequirePermissions('BADGE_WRITE')
  manualAward(
    @Param('badgeId') badgeId: string,
    @Param('donorId') donorId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.badgesService.manualAward(donorId, badgeId, user.id);
  }
}
