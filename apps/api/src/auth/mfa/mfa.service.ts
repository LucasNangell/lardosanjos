import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit.service';
import {
  decryptSecret,
  encryptSecret,
  generateBackupCodes,
  hashBackupCode,
} from './mfa-crypto.util';
import { hasFinancialPermission } from './mfa.constants';

authenticator.options = { window: 1 };

@Injectable()
export class MfaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly audit: AuditService,
  ) {}

  async getStatus(userId: string, permissions: string[]) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return {
      required: hasFinancialPermission(permissions),
      enabled: Boolean(user?.totpEnabledAt),
      enabled_at: user?.totpEnabledAt?.toISOString() ?? null,
    };
  }

  async beginSetup(userId: string, email: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    if (user.totpEnabledAt) {
      throw new BadRequestException('2FA já está ativo. Desative antes de reconfigurar.');
    }

    const secret = authenticator.generateSecret();
    const encrypted = encryptSecret(secret);
    const backupCodes = generateBackupCodes();
    const backupHashes = backupCodes.map(hashBackupCode);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        totpSecretEnc: encrypted,
        totpBackupCodes: backupHashes,
        totpEnabledAt: null,
      },
    });

    const otpauth = authenticator.keyuri(email, 'Lar dos Anjos Admin', secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

    await this.audit.log({
      userId,
      action: 'MFA_SETUP_BEGIN',
      entity: 'users',
      entityId: userId,
    });

    return {
      qr_code_data_url: qrCodeDataUrl,
      manual_entry_key: secret,
      backup_codes: backupCodes,
    };
  }

  async enable(userId: string, code: string) {
    await this.verifyCodeForUser(userId, code);
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { totpEnabledAt: new Date() },
    });

    await this.audit.log({
      userId,
      action: 'MFA_ENABLED',
      entity: 'users',
      entityId: userId,
    });

    return { enabled: true, enabled_at: user.totpEnabledAt?.toISOString() };
  }

  async createLoginSession(userId: string) {
    return this.jwtService.sign(
      { sub: userId, purpose: 'mfa-login' },
      { secret: process.env.JWT_SECRET, expiresIn: '5m' },
    );
  }

  async completeLogin(sessionToken: string, code: string) {
    let payload: { sub?: string; purpose?: string };
    try {
      payload = this.jwtService.verify(sessionToken, {
        secret: process.env.JWT_SECRET,
      }) as { sub?: string; purpose?: string };
    } catch {
      throw new UnauthorizedException('Sessão MFA expirada');
    }

    if (payload.purpose !== 'mfa-login' || !payload.sub) {
      throw new UnauthorizedException('Token MFA inválido');
    }

    await this.verifyCodeForUser(payload.sub, code);
    return payload.sub;
  }

  async createStepUpToken(userId: string) {
    return this.jwtService.sign(
      { sub: userId, purpose: 'financial-step-up' },
      { secret: process.env.JWT_SECRET, expiresIn: '5m' },
    );
  }

  validateStepUpToken(token: string, userId: string): boolean {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      }) as { sub?: string; purpose?: string };
      return payload.purpose === 'financial-step-up' && payload.sub === userId;
    } catch {
      return false;
    }
  }

  async stepUp(userId: string, code: string, ip?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.totpEnabledAt) {
      throw new ForbiddenException({
        code: 'MFA_SETUP_REQUIRED',
        message: 'Configure o 2FA antes de ações financeiras sensíveis.',
      });
    }

    await this.verifyCodeForUser(userId, code);

    const stepUpToken = await this.createStepUpToken(userId);

    await this.audit.log({
      userId,
      action: 'MFA_STEP_UP',
      entity: 'users',
      entityId: userId,
      ipAddress: ip,
    });

    return {
      step_up_token: stepUpToken,
      expires_in_seconds: 300,
    };
  }

  async resetForUser(adminUserId: string, targetUserId: string, ip?: string) {
    await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        totpSecretEnc: null,
        totpEnabledAt: null,
        totpBackupCodes: Prisma.DbNull,
      },
    });

    await this.audit.log({
      userId: adminUserId,
      action: 'MFA_RESET',
      entity: 'users',
      entityId: targetUserId,
      ipAddress: ip,
    });

    return { reset: true };
  }

  private async verifyCodeForUser(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.totpSecretEnc) {
      throw new BadRequestException('2FA não configurado');
    }

    const normalized = code.replace(/\s/g, '').toUpperCase();

    const backupHashes = (user.totpBackupCodes as string[] | null) ?? [];
    const backupIndex = backupHashes.findIndex((h) => h === hashBackupCode(normalized));
    if (backupIndex >= 0) {
      const remaining = backupHashes.filter((_, i) => i !== backupIndex);
      await this.prisma.user.update({
        where: { id: userId },
        data: { totpBackupCodes: remaining },
      });
      await this.audit.log({
        userId,
        action: 'MFA_BACKUP_CODE_USED',
        entity: 'users',
        entityId: userId,
      });
      return;
    }

    const secret = decryptSecret(user.totpSecretEnc);
    const valid = authenticator.verify({ token: normalized, secret });
    if (!valid) {
      throw new UnauthorizedException('Código 2FA inválido');
    }
  }
}
