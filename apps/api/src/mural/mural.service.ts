import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit.service';

@Injectable()
export class MuralService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findPublicEntries(limit = 50, sort: 'recent' | 'impact' = 'recent') {
    const entries = await this.prisma.publicMuralEntry.findMany({
      where: { isVisible: true },
      orderBy:
        sort === 'impact'
          ? [{ impactMonths: 'desc' }, { createdAt: 'desc' }]
          : { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 100),
      include: {
        donor: {
          select: {
            donorBadges: {
              include: { badge: { select: { id: true, name: true, icon: true } } },
            },
          },
        },
      },
    });

    return entries.map((entry) => ({
      id: entry.id,
      displayName: entry.displayName,
      planName: entry.planName,
      impactMonths: entry.impactMonths,
      message: entry.message,
      badges: entry.donor?.donorBadges.map((item) => ({
        id: item.badge.id,
        name: item.badge.name,
        icon: item.badge.icon,
      })) ?? [],
      createdAt: entry.createdAt,
    }));
  }

  async findAllAdmin() {
    const entries = await this.prisma.publicMuralEntry.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return entries.map((entry) => ({
      id: entry.id,
      displayName: entry.displayName,
      planName: entry.planName,
      impactMonths: entry.impactMonths,
      message: entry.message,
      isVisible: entry.isVisible,
      createdAt: entry.createdAt.toISOString(),
    }));
  }

  async setVisibility(id: string, isVisible: boolean, adminUserId: string) {
    const existing = await this.prisma.publicMuralEntry.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Entrada não encontrada');
    }

    const entry = await this.prisma.publicMuralEntry.update({
      where: { id },
      data: { isVisible },
    });

    await this.audit.log({
      userId: adminUserId,
      action: isVisible ? 'MURAL_SHOW' : 'MURAL_HIDE',
      entity: 'public_mural_entries',
      entityId: id,
      oldData: { isVisible: existing.isVisible },
      newData: { isVisible },
    });

    return { id: entry.id, isVisible: entry.isVisible };
  }
}
