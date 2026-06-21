import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/auth.decorators';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';

@Controller('admin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminController {
  @Get('dashboard')
  @RequirePermissions('FINANCE_READ')
  getDashboard(@CurrentUser() user: AuthUser) {
    return {
      message: 'Painel administrativo',
      user: { id: user.id, name: user.name, email: user.email },
    };
  }
}
