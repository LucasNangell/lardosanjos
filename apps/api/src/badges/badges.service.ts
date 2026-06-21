import { Injectable, NotFoundException } from '@nestjs/common';
import { BadgeRuleType, SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit.service';
import {
  CONFIRMED_PAYMENT_STATUSES,
  CONFIRMED_PIX_STATUS,
} from '../common/constants/finance.constants';

@Injectable()
export class BadgesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  listBadges() {
    return this.prisma.badge.findMany({
      orderBy: { name: 'asc' },
    });
  }

  listDonorBadges(donorId: string) {
    return this.prisma.donorBadge.findMany({
      where: { donorId },
      include: { badge: true },
      orderBy: { awardedAt: 'desc' },
    });
  }

  async syncAllDonors(adminUserId?: string) {
    const donors = await this.prisma.donor.findMany({ select: { id: true } });
    let awarded = 0;

    for (const donor of donors) {
      const count = await this.evaluateDonor(donor.id);
      awarded += count;
    }

    if (adminUserId) {
      await this.audit.log({
        userId: adminUserId,
        action: 'SYNC_BADGES',
        entity: 'badges',
        entityId: 'all',
        newData: { donors: donors.length, badges_awarded: awarded },
      });
    }

    return { donors_processed: donors.length, badges_awarded: awarded };
  }

  async evaluateDonor(donorId: string): Promise<number> {
    const badges = await this.prisma.badge.findMany();
    let awarded = 0;

    for (const badge of badges) {
      const eligible = await this.isEligible(donorId, badge.ruleType, badge.ruleValue);
      if (!eligible) continue;

      const existing = await this.prisma.donorBadge.findUnique({
        where: { donorId_badgeId: { donorId, badgeId: badge.id } },
      });
      if (existing) continue;

      await this.prisma.donorBadge.create({
        data: { donorId, badgeId: badge.id },
      });
      awarded += 1;
    }

    return awarded;
  }

  async awardCampaignSupporter(donorId: string | null | undefined) {
    if (!donorId) return;

    const badge = await this.prisma.badge.findFirst({
      where: { name: 'Apoiador de Campanha' },
    });
    if (!badge) return;

    await this.prisma.donorBadge.upsert({
      where: { donorId_badgeId: { donorId, badgeId: badge.id } },
      update: {},
      create: { donorId, badgeId: badge.id },
    });
  }

  async manualAward(donorId: string, badgeId: string, adminUserId: string) {
    const badge = await this.prisma.badge.findUnique({ where: { id: badgeId } });
    if (!badge) {
      throw new NotFoundException('Selo não encontrado');
    }

    const entry = await this.prisma.donorBadge.upsert({
      where: { donorId_badgeId: { donorId, badgeId } },
      update: {},
      create: { donorId, badgeId },
    });

    await this.audit.log({
      userId: adminUserId,
      action: 'AWARD_BADGE',
      entity: 'donor_badges',
      entityId: entry.id,
      newData: { donorId, badgeId, badgeName: badge.name },
    });

    return entry;
  }

  private async isEligible(
    donorId: string,
    ruleType: BadgeRuleType,
    ruleValue: number | null,
  ) {
    switch (ruleType) {
      case 'FIRST_DONATION':
        return this.hasFirstDonation(donorId);
      case 'MONTHS_ACTIVE':
        return (await this.getSupportMonths(donorId)) >= (ruleValue ?? 1);
      case 'SUBSCRIPTION':
        return this.hasActiveSubscription(donorId);
      case 'TOTAL_AMOUNT':
        return (await this.getTotalConfirmed(donorId)) >= (ruleValue ?? 0);
      case 'MANUAL':
        return false;
      default:
        return false;
    }
  }

  private async hasFirstDonation(donorId: string) {
    const [payments, pix] = await Promise.all([
      this.prisma.payment.count({
        where: { donorId, status: { in: CONFIRMED_PAYMENT_STATUSES } },
      }),
      this.prisma.pixDonation.count({
        where: { donorId, status: CONFIRMED_PIX_STATUS },
      }),
    ]);
    return payments + pix >= 1;
  }

  private async hasActiveSubscription(donorId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { donorId, status: SubscriptionStatus.ACTIVE },
    });
    return Boolean(sub);
  }

  private async getSupportMonths(donorId: string): Promise<number> {
    const sub = await this.prisma.subscription.findFirst({
      where: { donorId, status: { in: ['ACTIVE', 'INACTIVE', 'CANCELED'] } },
      orderBy: { startedAt: 'asc' },
    });

    if (sub?.startedAt) {
      const diffMs = Date.now() - sub.startedAt.getTime();
      return Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30)));
    }

    const confirmedPix = await this.prisma.pixDonation.count({
      where: { donorId, status: CONFIRMED_PIX_STATUS },
    });
    const confirmedPayments = await this.prisma.payment.count({
      where: { donorId, status: { in: CONFIRMED_PAYMENT_STATUSES } },
    });

    return confirmedPix + confirmedPayments > 0 ? 1 : 0;
  }

  private async getTotalConfirmed(donorId: string) {
    const [paymentAgg, pixAgg] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { donorId, status: { in: CONFIRMED_PAYMENT_STATUSES } },
        _sum: { value: true },
      }),
      this.prisma.pixDonation.aggregate({
        where: { donorId, status: CONFIRMED_PIX_STATUS },
        _sum: { amount: true },
      }),
    ]);

    return Number(paymentAgg._sum.value ?? 0) + Number(pixAgg._sum.amount ?? 0);
  }
}
