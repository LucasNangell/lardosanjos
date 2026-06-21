import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
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
import { MfaService } from '../../auth/mfa/mfa.service';
import { AdminUsersService } from './admin-users.service';
import { IsArray, IsEmail, IsString, MinLength } from 'class-validator';

class CreateAdminUserDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsArray()
  @IsString({ each: true })
  role_names!: string[];
}

class UpdateRolesDto {
  @IsArray()
  @IsString({ each: true })
  role_names!: string[];
}

@Controller('admin/users')
@UseGuards(JwtAuthGuard, PermissionsGuard, FinancialMfaGuard)
export class AdminUsersController {
  constructor(
    private readonly adminUsersService: AdminUsersService,
    private readonly mfaService: MfaService,
  ) {}

  @Get()
  @RequirePermissions('ADMIN_USERS_MANAGE')
  list() {
    return this.adminUsersService.list();
  }

  @Post()
  @RequirePermissions('ADMIN_USERS_MANAGE')
  @RequireFinancialMfa()
  create(
    @Body() dto: CreateAdminUserDto,
    @CurrentUser() user: AuthUser,
    @Req() req: FastifyRequest,
  ) {
    return this.adminUsersService.create(
      user.id,
      {
        name: dto.name,
        email: dto.email,
        password: dto.password,
        roleNames: dto.role_names,
      },
      req.ip,
    );
  }

  @Patch(':id/roles')
  @RequirePermissions('ADMIN_USERS_MANAGE')
  @RequireFinancialMfa()
  updateRoles(
    @Param('id') id: string,
    @Body() dto: UpdateRolesDto,
    @CurrentUser() user: AuthUser,
    @Req() req: FastifyRequest,
  ) {
    return this.adminUsersService.updateRoles(user.id, id, dto.role_names, req.ip);
  }

  @Post(':id/deactivate')
  @RequirePermissions('ADMIN_USERS_MANAGE')
  @RequireFinancialMfa()
  deactivate(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Req() req: FastifyRequest,
  ) {
    return this.adminUsersService.deactivate(user.id, id, req.ip);
  }

  @Post(':id/reset-mfa')
  @RequirePermissions('ADMIN_USERS_MANAGE')
  @RequireFinancialMfa()
  resetMfa(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Req() req: FastifyRequest,
  ) {
    return this.mfaService.resetForUser(user.id, id, req.ip);
  }
}
