import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PixConfirmationAction, PixDonationStatus } from '@lardosanjos/database';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit.service';
import { StorageService } from '../../storage/storage.service';
import { ListPixDonationsQueryDto, PixDonationActionDto } from './pix-donations.dto';
import { CONFIRMED_PIX_STATUS } from '../../common/constants/finance.constants';
import { BadgesService } from '../../badges/badges.service';
import { CampaignDonationsService } from '../../campaigns/campaign-donations.service';
import {
  createReceiptAccessToken,
  verifyReceiptAccessToken,
} from './pix-receipt-access.util';

const TERMINAL_STATUSES: PixDonationStatus[] = [
  'CONFIRMADO_MANUALMENTE',
  'REJEITADO',
  'DUPLICADO',
  'EXPIRADO',
];

@Injectable()
export class PixDonationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly storageService: StorageService,
    private readonly badgesService: BadgesService,
    private readonly campaignDonationsService: CampaignDonationsService,
  ) {}

  async list(query: ListPixDonationsQueryDto) {
    const page = Math.max(1, parseInt(query.page ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10)));
    const skip = (page - 1) * limit;

    const where = this.buildListWhere(query);

    const [items, total] = await Promise.all([
      this.prisma.pixDonation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          donor: { select: { id: true, fullName: true, email: true } },
          receiptFile: { select: { id: true, mimeType: true } },
          manuallyConfirmedBy: { select: { id: true, name: true } },
          rejectedBy: { select: { id: true, name: true } },
        },
      }),
      this.prisma.pixDonation.count({ where }),
    ]);

    return {
      items: items.map((d) => this.toListItem(d)),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async getById(id: string) {
    const donation = await this.prisma.pixDonation.findUnique({
      where: { id },
      include: {
        donor: true,
        receiptFile: true,
        manuallyConfirmedBy: { select: { id: true, name: true, email: true } },
        rejectedBy: { select: { id: true, name: true, email: true } },
        confirmations: {
          orderBy: { createdAt: 'desc' },
          include: { adminUser: { select: { id: true, name: true } } },
        },
      },
    });

    if (!donation) {
      throw new NotFoundException('Doação Pix não encontrada');
    }

    return {
      ...this.toListItem(donation),
      donor_message: donation.donorMessage,
      wants_public_mural: donation.wantsPublicMural,
      wants_anonymous: donation.wantsAnonymous,
      rejection_reason: donation.rejectionReason,
      pix_payload: donation.pixPayload,
      confirmations: donation.confirmations.map((c) => ({
        id: c.id,
        action: c.action,
        previous_status: c.previousStatus,
        new_status: c.newStatus,
        note: c.note,
        admin: c.adminUser ? { id: c.adminUser.id, name: c.adminUser.name } : null,
        created_at: c.createdAt.toISOString(),
      })),
    };
  }

  async getReceiptAccessUrl(id: string, adminUserId: string) {
    const donation = await this.prisma.pixDonation.findUnique({
      where: { id },
      include: { receiptFile: { select: { id: true, mimeType: true } } },
    });

    if (!donation) {
      throw new NotFoundException('Doação Pix não encontrada');
    }

    if (!donation.receiptFileId || !donation.receiptFile) {
      throw new NotFoundException('Esta doação não possui comprovante.');
    }

    const token = createReceiptAccessToken({
      fileId: donation.receiptFileId,
      donationId: donation.id,
      adminUserId,
    });

    const apiBase =
      process.env.API_PUBLIC_URL ||
      process.env.API_URL ||
      'http://localhost:4000/api/v1';

    return {
      url: `${apiBase.replace(/\/$/, '')}/admin/pix/receipts/${token}`,
      expires_in_seconds: 300,
      mime_type: donation.receiptFile.mimeType,
    };
  }

  async streamReceipt(token: string) {
    const payload = verifyReceiptAccessToken(token);
    if (!payload) {
      throw new NotFoundException('Link de comprovante inválido ou expirado.');
    }

    const donation = await this.prisma.pixDonation.findUnique({
      where: { id: payload.donationId },
    });

    if (!donation?.receiptFileId || donation.receiptFileId !== payload.fileId) {
      throw new NotFoundException('Comprovante não encontrado.');
    }

    const file = await this.storageService.getFileBuffer(payload.fileId);
    return file;
  }

  async confirm(id: string, adminUserId: string, dto: PixDonationActionDto, ip?: string) {
    return this.transition(
      id,
      adminUserId,
      ['AGUARDANDO_CONFIRMACAO_MANUAL', 'COMPROVANTE_ENVIADO'],
      CONFIRMED_PIX_STATUS,
      'CONFIRM',
      dto.note,
      ip,
      async (tx, donation) => {
        if (donation.wantsPublicMural) {
          await this.createMuralEntry(tx, donation);
        }
        if (donation.donorId) {
          await this.badgesService.evaluateDonor(donation.donorId);
        }
        const campaignId =
          await this.campaignDonationsService.getCampaignIdForPix(donation.id);
        if (campaignId && donation.donorId) {
          await this.badgesService.awardCampaignSupporter(donation.donorId);
        }
      },
    );
  }

  async reject(id: string, adminUserId: string, dto: PixDonationActionDto, ip?: string) {
    const reason = dto.rejection_reason?.trim() || dto.note?.trim();
    if (!reason) {
      throw new BadRequestException('Motivo de rejeição é obrigatório.');
    }

    const donation = await this.findOrThrow(id);
    this.assertActionAllowed(donation.status, ['AGUARDANDO_CONFIRMACAO_MANUAL', 'COMPROVANTE_ENVIADO', 'PIX_GERADO']);

    const previousStatus = donation.status;

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.pixDonation.update({
        where: { id },
        data: {
          status: 'REJEITADO',
          rejectedAt: new Date(),
          rejectedById: adminUserId,
          rejectionReason: reason,
        },
      });

      await tx.pixPaymentConfirmation.create({
        data: {
          pixDonationId: id,
          action: 'REJECT',
          previousStatus,
          newStatus: 'REJEITADO',
          adminUserId,
          note: reason,
        },
      });

      return row;
    });

    await this.audit(id, adminUserId, 'REJECT', previousStatus, 'REJEITADO', ip, {
      rejection_reason: reason,
    });

    return this.toListItem(updated);
  }

  async markDuplicate(id: string, adminUserId: string, dto: PixDonationActionDto, ip?: string) {
    return this.transition(
      id,
      adminUserId,
      ['AGUARDANDO_CONFIRMACAO_MANUAL', 'COMPROVANTE_ENVIADO', 'PIX_GERADO'],
      'DUPLICADO',
      'MARK_DUPLICATE',
      dto.note,
      ip,
    );
  }

  async requestInfo(id: string, adminUserId: string, dto: PixDonationActionDto, ip?: string) {
    const donation = await this.findOrThrow(id);
    this.assertActionAllowed(donation.status, [
      'AGUARDANDO_CONFIRMACAO_MANUAL',
      'COMPROVANTE_ENVIADO',
      'PIX_GERADO',
    ]);

    const note =
      dto.note?.trim() ||
      'Informações adicionais solicitadas ao doador. Envio de e-mail pendente de integração.';

    await this.auditService.log({
      userId: adminUserId,
      action: 'REQUEST_INFO',
      entity: 'pix_donations',
      entityId: id,
      newData: {
        note,
        donor_email: donation.donorEmail,
        email_pending: true,
      },
      ipAddress: ip,
    });

    return {
      id: donation.id,
      status: donation.status,
      message: note,
      email_pending: true,
    };
  }

  private buildListWhere(query: ListPixDonationsQueryDto) {
    const where: Record<string, unknown> = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.email) {
      where.donorEmail = { contains: query.email.toLowerCase() };
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { donorName: { contains: term } },
        { donorEmail: { contains: term.toLowerCase() } },
        { donorPhone: { contains: term } },
        { txid: { contains: term } },
      ];
    }

    if (query.from || query.to) {
      where.createdAt = {
        ...(query.from && { gte: new Date(query.from) }),
        ...(query.to && { lte: new Date(`${query.to}T23:59:59.999Z`) }),
      };
    }

    if (query.min_amount || query.max_amount) {
      where.amount = {
        ...(query.min_amount && { gte: Number(query.min_amount) }),
        ...(query.max_amount && { lte: Number(query.max_amount) }),
      };
    }

    if (query.has_receipt === 'true') {
      where.receiptFileId = { not: null };
    } else if (query.has_receipt === 'false') {
      where.receiptFileId = null;
    }

    return where;
  }

  private async transition(
    id: string,
    adminUserId: string,
    allowedFrom: PixDonationStatus[],
    newStatus: PixDonationStatus,
    action: PixConfirmationAction,
    note: string | undefined,
    ip: string | undefined,
    afterUpdate?: (
      tx: Pick<
        PrismaService,
        'publicMuralEntry' | 'subscription' | 'payment' | 'pixDonation'
      >,
      donation: Awaited<ReturnType<typeof this.findOrThrow>>,
    ) => Promise<void>,
  ) {
    const donation = await this.findOrThrow(id);
    this.assertActionAllowed(donation.status, allowedFrom);

    const previousStatus = donation.status;

    const updated = await this.prisma.$transaction(async (tx) => {
      const row = await tx.pixDonation.update({
        where: { id },
        data: {
          status: newStatus,
          ...(newStatus === CONFIRMED_PIX_STATUS
            ? {
                manuallyConfirmedAt: new Date(),
                manuallyConfirmedById: adminUserId,
              }
            : {}),
        },
      });

      await tx.pixPaymentConfirmation.create({
        data: {
          pixDonationId: id,
          action,
          previousStatus,
          newStatus,
          adminUserId,
          note,
        },
      });

      if (afterUpdate) {
        await afterUpdate(tx, donation);
      }

      return row;
    });

    await this.audit(id, adminUserId, action, previousStatus, newStatus, ip);

    return this.toListItem(updated);
  }

  private assertActionAllowed(
    current: PixDonationStatus,
    allowedFrom: PixDonationStatus[],
  ) {
    if (TERMINAL_STATUSES.includes(current)) {
      throw new BadRequestException(
        'Esta doação já foi finalizada e não pode ser alterada sem revisão explícita.',
      );
    }

    if (!allowedFrom.includes(current)) {
      throw new BadRequestException('Ação não permitida neste status.');
    }
  }

  private async createMuralEntry(
    tx: Pick<PrismaService, 'publicMuralEntry' | 'subscription' | 'payment' | 'pixDonation'>,
    donation: Awaited<ReturnType<typeof this.findOrThrow>>,
  ) {
    const existing = await tx.publicMuralEntry.findFirst({
      where: { pixDonationId: donation.id },
    });
    if (existing) return;

    const displayName = donation.wantsAnonymous
      ? 'Anjo Anônimo'
      : donation.donorName ?? 'Anjo';

    const impactMonths = await this.computeImpactMonths(tx, donation.donorId);

    await tx.publicMuralEntry.create({
      data: {
        donorId: donation.donorId,
        pixDonationId: donation.id,
        displayName,
        message: donation.donorMessage,
        impactMonths,
        isVisible: true,
      },
    });
  }

  private async computeImpactMonths(
    tx: Pick<PrismaService, 'subscription' | 'payment' | 'pixDonation'>,
    donorId: string | null,
  ) {
    if (!donorId) return null;

    const subscription = await tx.subscription.findFirst({
      where: { donorId, status: 'ACTIVE' },
    });
    if (subscription?.startedAt) {
      const diffMs = Date.now() - subscription.startedAt.getTime();
      return Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30)));
    }

    const [pixCount, paymentCount] = await Promise.all([
      tx.pixDonation.count({
        where: { donorId, status: CONFIRMED_PIX_STATUS },
      }),
      tx.payment.count({
        where: { donorId, status: { in: ['RECEIVED', 'CONFIRMED'] } },
      }),
    ]);

    return pixCount + paymentCount > 0 ? 1 : null;
  }

  private async findOrThrow(id: string) {
    const donation = await this.prisma.pixDonation.findUnique({ where: { id } });
    if (!donation) {
      throw new NotFoundException('Doação Pix não encontrada');
    }
    return donation;
  }

  private async audit(
    id: string,
    adminUserId: string,
    action: string,
    previousStatus: PixDonationStatus,
    newStatus: PixDonationStatus,
    ip?: string,
    extra?: Record<string, unknown>,
  ) {
    await this.auditService.log({
      userId: adminUserId,
      action,
      entity: 'pix_donations',
      entityId: id,
      oldData: { status: previousStatus },
      newData: { status: newStatus, ...extra },
      ipAddress: ip,
    });
  }

  private toListItem(donation: {
    id: string;
    donorId: string | null;
    donorName: string | null;
    donorEmail: string | null;
    donorPhone: string | null;
    donorMessage?: string | null;
    amount: unknown;
    txid: string;
    status: PixDonationStatus;
    markedAsPaidAt: Date | null;
    manuallyConfirmedAt: Date | null;
    expiresAt: Date;
    createdAt: Date;
    donor?: { id: string; fullName: string; email: string } | null;
    receiptFile?: { id: string; mimeType: string } | null;
    manuallyConfirmedBy?: { id: string; name: string } | null;
    rejectedBy?: { id: string; name: string } | null;
  }) {
    return {
      id: donation.id,
      donor_id: donation.donorId,
      donor_name: donation.donorName,
      donor_email: donation.donorEmail,
      donor_phone: donation.donorPhone,
      donor_message: donation.donorMessage ?? null,
      amount: Number(donation.amount),
      txid: donation.txid,
      status: donation.status,
      marked_as_paid_at: donation.markedAsPaidAt?.toISOString() ?? null,
      manually_confirmed_at: donation.manuallyConfirmedAt?.toISOString() ?? null,
      manually_confirmed_by: donation.manuallyConfirmedBy
        ? { id: donation.manuallyConfirmedBy.id, name: donation.manuallyConfirmedBy.name }
        : null,
      rejected_by: donation.rejectedBy
        ? { id: donation.rejectedBy.id, name: donation.rejectedBy.name }
        : null,
      expires_at: donation.expiresAt.toISOString(),
      created_at: donation.createdAt.toISOString(),
      donor: donation.donor,
      receipt: donation.receiptFile
        ? { id: donation.receiptFile.id, mime_type: donation.receiptFile.mimeType }
        : null,
      has_receipt: Boolean(donation.receiptFile),
    };
  }
}
