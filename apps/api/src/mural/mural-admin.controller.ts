import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/auth.decorators';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { MuralService } from './mural.service';

@Controller('admin/mural')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class MuralAdminController {
  constructor(private readonly muralService: MuralService) {}

  @Get()
  @RequirePermissions('MURAL_READ')
  list() {
    return this.muralService.findAllAdmin();
  }

  @Patch(':id/visibility')
  @RequirePermissions('MURAL_WRITE')
  setVisibility(
    @Param('id') id: string,
    @Body() body: { is_visible: boolean },
    @CurrentUser() user: AuthUser,
  ) {
    return this.muralService.setVisibility(id, body.is_visible, user.id);
  }
}
