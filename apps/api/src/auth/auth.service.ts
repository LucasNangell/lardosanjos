import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/email.service';
import { AuditService } from '../common/audit.service';
import { AuthUser } from './interfaces/auth-user.interface';
import { LoginDto, ForgotPasswordDto, ResetPasswordDto, MfaCompleteLoginDto } from './dto/auth.dto';
import { MfaService } from './mfa/mfa.service';
import { hasFinancialPermission } from './mfa/mfa.constants';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly auditService: AuditService,
    private readonly mfaService: MfaService,
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async loadUserPermissions(userId: string) {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    const roles = userRoles.map((ur) => ur.role.name);
    const permissions = [
      ...new Set(
        userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => rp.permission.name),
        ),
      ),
    ];

    return { roles, permissions };
  }

  private toAuthUser(
    user: { id: string; email: string; name: string },
    roles: string[],
    permissions: string[],
  ): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roles,
      permissions,
    };
  }

  async login(dto: LoginDto, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const { roles, permissions } = await this.loadUserPermissions(user.id);
    const authUser = this.toAuthUser(user, roles, permissions);

    if (user.totpEnabledAt && hasFinancialPermission(permissions)) {
      const mfaSessionToken = await this.mfaService.createLoginSession(user.id);
      return {
        requiresMfa: true as const,
        mfaSessionToken,
        user: authUser,
      };
    }

    return this.issueTokens(user, authUser, permissions, roles, ipAddress);
  }

  async completeMfaLogin(dto: MfaCompleteLoginDto, ipAddress?: string) {
    const userId = await this.mfaService.completeLogin(dto.mfa_session_token, dto.code);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Usuário inválido');
    }
    const { roles, permissions } = await this.loadUserPermissions(user.id);
    const authUser = this.toAuthUser(user, roles, permissions);
    return this.issueTokens(user, authUser, permissions, roles, ipAddress);
  }

  private async issueTokens(
    user: { id: string; email: string; name: string },
    authUser: AuthUser,
    permissions: string[],
    roles: string[],
    ipAddress?: string,
  ) {
    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, permissions, roles },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
      },
    );

    const refreshToken = crypto.randomBytes(48).toString('hex');
    const refreshExpires = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    const expiresAt = new Date(
      Date.now() + this.parseDuration(refreshExpires),
    );

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt,
      },
    });

    await this.auditService.log({
      userId: user.id,
      action: 'LOGIN',
      entity: 'users',
      entityId: user.id,
      ipAddress,
    });

    return {
      requiresMfa: false as const,
      user: authUser,
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!stored || stored.user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Sessão inválida');
    }

    const { roles, permissions } = await this.loadUserPermissions(stored.userId);

    const accessToken = this.jwtService.sign(
      {
        sub: stored.user.id,
        email: stored.user.email,
        permissions,
        roles,
      },
      {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
      },
    );

    return { accessToken };
  }

  async logout(refreshToken: string, userId?: string) {
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    if (userId) {
      await this.auditService.log({
        userId,
        action: 'LOGOUT',
        entity: 'users',
        entityId: userId,
      });
    }
  }

  async donorLogin(dto: LoginDto, ipAddress?: string) {
    const result = await this.login(dto, ipAddress);

    if ('requiresMfa' in result && result.requiresMfa) {
      throw new UnauthorizedException('Use o portal web para login de doador com 2FA admin');
    }

    const donor = await this.prisma.donor.findUnique({
      where: { userId: result.user.id },
    });

    if (!donor) {
      throw new UnauthorizedException('Conta de doador não encontrada');
    }

    return {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      donor: {
        id: donor.id,
        full_name: donor.fullName,
        email: donor.email,
      },
    };
  }

  async me(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException();
    }
    const { roles, permissions } = await this.loadUserPermissions(userId);
    return this.toAuthUser(user, roles, permissions);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    // Resposta genérica — não revela se e-mail existe
    if (!user || user.status !== 'ACTIVE') {
      return { message: 'Se o e-mail existir, enviaremos instruções de recuperação.' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(token),
        expiresAt,
      },
    });

    const adminUrl = process.env.ADMIN_URL || 'http://localhost:3001';
    const resetUrl = `${adminUrl}/redefinir-senha?token=${token}`;

    await this.emailService.sendPasswordResetEmail(user.email, resetUrl);

    await this.auditService.log({
      userId: user.id,
      action: 'PASSWORD_RESET_REQUEST',
      entity: 'users',
      entityId: user.id,
    });

    return { message: 'Se o e-mail existir, enviaremos instruções de recuperação.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = this.hashToken(dto.token);
    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!resetToken) {
      throw new BadRequestException('Token inválido ou expirado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: resetToken.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    await this.auditService.log({
      userId: resetToken.userId,
      action: 'PASSWORD_RESET',
      entity: 'users',
      entityId: resetToken.userId,
    });

    return { message: 'Senha redefinida com sucesso' };
  }

  private parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };
    return value * (multipliers[unit] || multipliers.d);
  }
}
