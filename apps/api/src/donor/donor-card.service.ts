import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes, timingSafeEqual } from 'crypto';
import * as QRCode from 'qrcode';
import { DonorPublicDisplayType } from '@lardosanjos/database';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit.service';
import { cardStatusLabel, resolvePublicDisplayName } from './donor-card.utils';

@Injectable()
export class DonorCardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async ensureActiveCard(donorId: string) {
    const existing = await this.prisma.donorCard.findFirst({
      where: { donorId },
      orderBy: { createdAt: 'desc' },
    });

    if (existing?.status === 'ACTIVE') {
      return existing;
    }

    if (existing) {
      return this.prisma.donorCard.update({
        where: { id: existing.id },
        data: { status: 'ACTIVE' },
      });
    }

    return this.prisma.donorCard.create({
      data: {
        donorId,
        cardNumber: this.generateCardNumber(),
        qrCodeSecret: randomBytes(24).toString('hex'),
        status: 'ACTIVE',
      },
    });
  }

  async generateCard(
    donorId: string,
    userId: string,
    ipAddress?: string,
  ) {
    const activeSubscription = await this.prisma.subscription.findFirst({
      where: { donorId, status: 'ACTIVE' },
    });

    if (!activeSubscription) {
      throw new BadRequestException(
        'Carteirinha disponível apenas para assinantes mensais ativos.',
      );
    }

    const card = await this.ensureActiveCard(donorId);

    await this.auditService.log({
      userId,
      action: 'DONOR_CARD_GENERATE',
      entity: 'donor_cards',
      entityId: card.id,
      newData: { card_number: card.cardNumber, status: card.status },
      ipAddress,
    });

    return this.buildCardResponse(donorId, card);
  }

  async getCardForDonor(donorId: string) {
    const donor = await this.prisma.donor.findUnique({
      where: { id: donorId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
          take: 1,
        },
        donorBadges: {
          include: { badge: true },
          orderBy: { awardedAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!donor) {
      return null;
    }

    const activeSubscription = donor.subscriptions[0] ?? null;
    let card = await this.prisma.donorCard.findFirst({
      where: { donorId },
      orderBy: { createdAt: 'desc' },
    });

    if (activeSubscription && !card) {
      card = await this.ensureActiveCard(donorId);
    }

    if (!card) {
      return null;
    }

    if (card.status === 'ACTIVE' && !activeSubscription) {
      card = await this.prisma.donorCard.update({
        where: { id: card.id },
        data: { status: 'INACTIVE' },
      });
    }

    return this.buildCardResponse(donorId, card, donor);
  }

  async validateCard(cardNumber: string, token?: string) {
    const normalized = cardNumber.trim().toUpperCase();
    const card = await this.prisma.donorCard.findUnique({
      where: { cardNumber: normalized },
      include: {
        donor: {
          include: {
            subscriptions: {
              where: { status: 'ACTIVE' },
              include: { plan: true },
              take: 1,
            },
            donorBadges: {
              include: { badge: true },
              orderBy: { awardedAt: 'desc' },
              take: 3,
            },
          },
        },
      },
    });

    if (!card || !token?.trim() || !this.isValidToken(token, card.qrCodeSecret)) {
      return {
        valid: false,
        message: 'Carteirinha não encontrada ou inativa.',
      };
    }

    const subscription = card.donor.subscriptions[0];
    const subscriptionActive = Boolean(subscription);
    const isValid = card.status === 'ACTIVE' && subscriptionActive;

    if (!isValid) {
      return {
        valid: false,
        message: 'Carteirinha não encontrada ou inativa.',
      };
    }

    return {
      valid: true,
      card_number: card.cardNumber,
      display_name: resolvePublicDisplayName(card.donor),
      plan_name: subscription?.plan.name ?? null,
      member_since: subscription?.startedAt?.toISOString().slice(0, 10) ?? card.createdAt.toISOString().slice(0, 10),
      status_label: cardStatusLabel(card.status, subscriptionActive),
      badges: card.donor.donorBadges.map((entry) => ({
        name: entry.badge.name,
        icon: entry.badge.icon,
      })),
    };
  }

  async getQrPngBuffer(donorId: string): Promise<Buffer> {
    const cardData = await this.getCardForDonor(donorId);
    if (!cardData) {
      throw new NotFoundException('Carteirinha não disponível.');
    }

    return QRCode.toBuffer(cardData.validation_url, {
      type: 'png',
      width: 512,
      margin: 2,
      errorCorrectionLevel: 'M',
    });
  }

  private async buildCardResponse(
    donorId: string,
    card: {
      id: string;
      cardNumber: string;
      status: string;
      qrCodeSecret: string;
      createdAt: Date;
    },
    donorPreloaded?: {
      fullName: string;
      publicName: string | null;
      publicDisplayType: DonorPublicDisplayType;
      wantsPublicProfile: boolean;
      subscriptions: Array<{
        status: string;
        startedAt: Date | null;
        plan: { name: string; slug: string };
      }>;
      donorBadges: Array<{
        badge: { id: string; name: string; description: string | null; icon: string | null };
        awardedAt: Date;
      }>;
    },
  ) {
    const donor =
      donorPreloaded ??
      (await this.prisma.donor.findUnique({
        where: { id: donorId },
        include: {
          subscriptions: {
            where: { status: 'ACTIVE' },
            include: { plan: true },
            take: 1,
          },
          donorBadges: {
            include: { badge: true },
            orderBy: { awardedAt: 'desc' },
            take: 5,
          },
        },
      }));

    if (!donor) {
      throw new NotFoundException('Doador não encontrado.');
    }

    const subscription = donor.subscriptions[0] ?? null;
    const subscriptionActive = subscription?.status === 'ACTIVE';
    const isValid = card.status === 'ACTIVE' && subscriptionActive;
    const validationUrl = this.buildValidationUrl(
      card.cardNumber,
      card.qrCodeSecret,
    );
    const qrCodeDataUrl = await QRCode.toDataURL(validationUrl, {
      width: 280,
      margin: 1,
      errorCorrectionLevel: 'M',
    });

    return {
      id: card.id,
      card_number: card.cardNumber,
      status: card.status,
      valid: isValid,
      status_label: cardStatusLabel(card.status, subscriptionActive),
      display_name: resolvePublicDisplayName(donor),
      plan_name: subscription?.plan.name ?? null,
      plan_slug: subscription?.plan.slug ?? null,
      subscription_status: subscription?.status ?? null,
      issued_at: card.createdAt.toISOString(),
      started_at: subscription?.startedAt?.toISOString() ?? null,
      validation_url: validationUrl,
      qr_code_data_url: qrCodeDataUrl,
      badges: donor.donorBadges.map((entry) => ({
        id: entry.badge.id,
        name: entry.badge.name,
        description: entry.badge.description,
        icon: entry.badge.icon,
        awarded_at: entry.awardedAt.toISOString(),
      })),
    };
  }

  private buildValidationUrl(cardNumber: string, secret: string): string {
    const base =
      process.env.WEB_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000';
    const encoded = encodeURIComponent(cardNumber);
    return `${base.replace(/\/$/, '')}/anjo/validar/${encoded}?t=${secret}`;
  }

  private isValidToken(token: string, secret: string): boolean {
    const provided = Buffer.from(token.trim());
    const expected = Buffer.from(secret);

    if (provided.length !== expected.length) {
      return false;
    }

    return timingSafeEqual(provided, expected);
  }

  private generateCardNumber(): string {
    const segment = () =>
      randomBytes(2).toString('hex').toUpperCase().padStart(4, '0');
    return `LD-${segment()}-${segment()}-${segment()}`;
  }
}
