import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { MfaService } from '../mfa/mfa.service';
import { REQUIRE_FINANCIAL_MFA_KEY } from '../decorators/financial-mfa.decorator';
import { hasFinancialPermission } from '../mfa/mfa.constants';
import { AuthUser } from '../interfaces/auth-user.interface';

@Injectable()
export class FinancialMfaGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly mfaService: MfaService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_FINANCIAL_MFA_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthUser | undefined;
    if (!user) return false;

    if (!hasFinancialPermission(user.permissions)) {
      return true;
    }

    const dbUser = await this.prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser?.totpEnabledAt) {
      throw new ForbiddenException({
        code: 'MFA_SETUP_REQUIRED',
        message: 'Configure o 2FA em Configurações → Segurança antes desta ação.',
      });
    }

    const stepUpHeader = request.headers['x-mfa-step-up'];
    const token = Array.isArray(stepUpHeader) ? stepUpHeader[0] : stepUpHeader;
    if (!token || !this.mfaService.validateStepUpToken(token, user.id)) {
      throw new ForbiddenException({
        code: 'MFA_STEP_UP_REQUIRED',
        message: 'Confirme com código 2FA (POST /auth/mfa/step-up).',
      });
    }

    return true;
  }
}
