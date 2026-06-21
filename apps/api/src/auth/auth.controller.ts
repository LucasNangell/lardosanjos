import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/auth.decorators';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto, ForgotPasswordDto, ResetPasswordDto, MfaCompleteLoginDto } from './dto/auth.dto';
import { AuthUser } from './interfaces/auth-user.interface';

const REFRESH_COOKIE = 'refresh_token';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private setRefreshCookie(reply: FastifyReply, token: string) {
    const isProduction = process.env.NODE_ENV === 'production';
    reply.setCookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/api/v1/auth',
      maxAge: 7 * 24 * 60 * 60,
    });
  }

  private clearRefreshCookie(reply: FastifyReply) {
    reply.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
  }

  @Public()
  @Post('donor/login')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async donorLogin(
    @Body() dto: LoginDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const ip = req.ip;
    const result = await this.authService.donorLogin(dto, ip);
    this.setRefreshCookie(reply, result.refreshToken);
    return {
      user: result.user,
      accessToken: result.accessToken,
      donor: result.donor,
    };
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(
    @Body() dto: LoginDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const ip = req.ip;
    const result = await this.authService.login(dto, ip);
    if ('requiresMfa' in result && result.requiresMfa) {
      return {
        requiresMfa: true,
        mfaSessionToken: result.mfaSessionToken,
        user: result.user,
      };
    }
    this.setRefreshCookie(reply, result.refreshToken);
    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Public()
  @Post('mfa/complete-login')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async completeMfaLogin(
    @Body() dto: MfaCompleteLoginDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const result = await this.authService.completeMfaLogin(dto, req.ip);
    this.setRefreshCookie(reply, result.refreshToken);
    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    if (!refreshToken) {
      reply.status(401);
      return { message: 'Sessão expirada' };
    }
    return this.authService.refresh(refreshToken);
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  async logout(
    @Req() req: FastifyRequest,
    @CurrentUser() user: AuthUser,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const refreshToken = req.cookies?.[REFRESH_COOKIE];
    await this.authService.logout(refreshToken ?? '', user.id);
    this.clearRefreshCookie(reply);
    return { message: 'Logout realizado' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: AuthUser) {
    return this.authService.me(user.id);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(200)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
