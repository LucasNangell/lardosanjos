import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Public } from '../decorators/auth.decorators';
import { CurrentUser } from '../decorators/current-user.decorator';
import { AuthUser } from '../interfaces/auth-user.interface';
import { MfaService } from './mfa.service';
import { IsString, Length, MinLength } from 'class-validator';

class MfaCodeDto {
  @IsString()
  @Length(6, 16)
  code!: string;
}

@Controller('auth/mfa')
export class MfaController {
  constructor(private readonly mfaService: MfaService) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  status(@CurrentUser() user: AuthUser) {
    return this.mfaService.getStatus(user.id, user.permissions);
  }

  @Post('setup')
  @UseGuards(JwtAuthGuard)
  setup(@CurrentUser() user: AuthUser) {
    return this.mfaService.beginSetup(user.id, user.email);
  }

  @Post('enable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  enable(@CurrentUser() user: AuthUser, @Body() dto: MfaCodeDto) {
    return this.mfaService.enable(user.id, dto.code);
  }

  @Post('step-up')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  stepUp(
    @CurrentUser() user: AuthUser,
    @Body() dto: MfaCodeDto,
    @Req() req: FastifyRequest,
  ) {
    return this.mfaService.stepUp(user.id, dto.code, req.ip);
  }
}
