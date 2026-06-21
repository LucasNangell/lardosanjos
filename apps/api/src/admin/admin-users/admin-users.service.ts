import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit.service';

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        totpEnabledAt: true,
        createdAt: true,
        userRoles: {
          include: { role: { select: { name: true } } },
        },
      },
    });

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      status: u.status,
      mfa_enabled: Boolean(u.totpEnabledAt),
      roles: u.userRoles.map((ur) => ur.role.name),
      created_at: u.createdAt.toISOString(),
    }));
  }

  async create(
    adminId: string,
    data: { name: string; email: string; password: string; roleNames: string[] },
    ip?: string,
  ) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });
    if (existing) throw new BadRequestException('E-mail já cadastrado');

    const roles = await this.prisma.role.findMany({
      where: { name: { in: data.roleNames } },
    });
    if (roles.length !== data.roleNames.length) {
      throw new BadRequestException('Um ou mais papéis são inválidos');
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash,
        userRoles: {
          create: roles.map((r) => ({ roleId: r.id })),
        },
      },
    });

    await this.audit.log({
      userId: adminId,
      action: 'ADMIN_USER_CREATE',
      entity: 'users',
      entityId: user.id,
      newData: { email: user.email, roles: data.roleNames },
      ipAddress: ip,
    });

    return { id: user.id, email: user.email };
  }

  async updateRoles(
    adminId: string,
    userId: string,
    roleNames: string[],
    ip?: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuário não encontrado');

    const roles = await this.prisma.role.findMany({
      where: { name: { in: roleNames } },
    });
    if (roles.length !== roleNames.length) {
      throw new BadRequestException('Papel inválido');
    }

    await this.prisma.$transaction([
      this.prisma.userRole.deleteMany({ where: { userId } }),
      ...roles.map((r) =>
        this.prisma.userRole.create({ data: { userId, roleId: r.id } }),
      ),
    ]);

    await this.audit.log({
      userId: adminId,
      action: 'ADMIN_USER_UPDATE_ROLES',
      entity: 'users',
      entityId: userId,
      newData: { roles: roleNames },
      ipAddress: ip,
    });

    return { updated: true };
  }

  async deactivate(adminId: string, userId: string, ip?: string) {
    if (adminId === userId) {
      throw new BadRequestException('Não é possível desativar a própria conta');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'INACTIVE' },
    });

    await this.audit.log({
      userId: adminId,
      action: 'ADMIN_USER_DEACTIVATE',
      entity: 'users',
      entityId: userId,
      ipAddress: ip,
    });

    return { deactivated: true };
  }
}
