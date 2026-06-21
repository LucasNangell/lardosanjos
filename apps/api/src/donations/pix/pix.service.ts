import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as QRCode from 'qrcode';
import { randomBytes } from 'crypto';
import { PixDonationSchema, PixDonationInput } from '@lardosanjos/validators';
import { PrismaService } from '../../prisma/prisma.service';
import { PixEmvService } from './pix-emv.service';
import { StorageService } from '../../storage/storage.service';
import { CampaignDonationsService } from '../../campaigns/campaign-donations.service';
import { PixDonationStatus, PixSetting } from '@lardosanjos/database';
import {
  assertAllowedAmount,
  assertValidPixKey,
  parseQuickAmounts,
} from './pix-key.validator';

const PIX_EXPIRY_HOURS = 24;

@Injectable()
export class PixService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pixEmvService: PixEmvService,
    private readonly storageService: StorageService,
    private readonly campaignDonationsService: CampaignDonationsService,
  ) {}

  async getSettings() {
    const settings = await this.getActiveSettings();

    return {
      min_amount: Number(settings.minAmount),
      allow_custom_amount: settings.allowCustomAmount,
      quick_amounts: parseQuickAmounts(settings.quickAmounts),
      instructions: settings.instructions,
      require_donor_data: settings.requireDonorData,
      require_receipt_upload: settings.requireReceiptUpload,
      hide_sensitive_details: settings.hideSensitiveDetails,
      receiver_name: settings.hideSensitiveDetails
        ? undefined
        : settings.receiverName,
      receiver_city: settings.hideSensitiveDetails
        ? undefined
        : settings.receiverCity,
    };
  }

  async generatePix(rawInput: unknown) {
    const parsed = PixDonationSchema.safeParse(rawInput);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten().fieldErrors);
    }

    const input: PixDonationInput = parsed.data;
    const settings = await this.getActiveSettings();

    assertValidPixKey(settings.pixKey, settings.pixKeyType);
    assertAllowedAmount({
      amount: input.amount,
      minAmount: Number(settings.minAmount),
      allowCustomAmount: settings.allowCustomAmount,
      quickAmounts: parseQuickAmounts(settings.quickAmounts),
    });

    if (
      settings.requireDonorData &&
      (!input.donor_name || !input.donor_email)
    ) {
      throw new BadRequestException('Nome e e-mail são obrigatórios');
    }

    const txid = this.generateTxid(settings.defaultTxid);
    const pixPayload = this.pixEmvService.generatePayload({
      pixKey: settings.pixKey,
      pixKeyType: settings.pixKeyType,
      receiverName: settings.receiverName,
      receiverCity: settings.receiverCity,
      amount: input.amount,
      txid,
      description: settings.defaultDescription ?? undefined,
    });

    const qrCodeBase64 = await QRCode.toDataURL(pixPayload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 300,
    });

    const expiresAt = new Date(
      Date.now() + PIX_EXPIRY_HOURS * 60 * 60 * 1000,
    );

    const donation = await this.createDonationWithRetry({
      input,
      settings,
      pixPayload,
      qrCodeBase64,
      txid,
      expiresAt,
    });

    if (input.campaign_id) {
      await this.campaignDonationsService.linkPixDonation(
        input.campaign_id,
        donation.id,
      );
    }

    await this.prisma.pixPaymentConfirmation.create({
      data: {
        pixDonationId: donation.id,
        action: 'GENERATE',
        newStatus: 'PIX_GERADO',
      },
    });

    return {
      id: donation.id,
      amount: Number(donation.amount),
      pix_payload: donation.pixPayload,
      pix_qr_code_base64: donation.pixQrCodeBase64,
      txid: donation.txid,
      status: donation.status,
      expires_at: donation.expiresAt.toISOString(),
      instructions: settings.instructions,
      receiver_name: settings.hideSensitiveDetails
        ? 'Beneficiário configurado'
        : settings.receiverName,
      confirmed: false,
      pending: true,
    };
  }

  async getStatus(id: string) {
    const donation = await this.findDonationOrThrow(id);
    return {
      id: donation.id,
      status: donation.status,
      amount: Number(donation.amount),
      marked_as_paid_at: donation.markedAsPaidAt?.toISOString() ?? null,
      expires_at: donation.expiresAt.toISOString(),
      has_receipt: Boolean(donation.receiptFileId),
    };
  }

  async markAsPaid(id: string) {
    const donation = await this.findDonationOrThrow(id);
    this.assertNotExpired(donation.expiresAt);
    this.assertStatus(
      donation.status,
      ['PIX_GERADO', 'COMPROVANTE_ENVIADO'],
      'Não é possível marcar como pago neste status',
    );

    const previousStatus = donation.status;
    const newStatus: PixDonationStatus = 'AGUARDANDO_CONFIRMACAO_MANUAL';

    const updated = await this.prisma.pixDonation.update({
      where: { id },
      data: {
        status: newStatus,
        markedAsPaidAt: new Date(),
      },
    });

    await this.prisma.pixPaymentConfirmation.create({
      data: {
        pixDonationId: id,
        action: 'MARK_AS_PAID',
        previousStatus,
        newStatus,
      },
    });

    return {
      id: updated.id,
      status: updated.status,
      marked_as_paid_at: updated.markedAsPaidAt?.toISOString(),
    };
  }

  async uploadReceipt(
    id: string,
    buffer: Buffer,
    mimeType: string,
  ) {
    const donation = await this.findDonationOrThrow(id);
    this.assertNotExpired(donation.expiresAt);
    this.assertStatus(
      donation.status,
      ['PIX_GERADO', 'AGUARDANDO_CONFIRMACAO_MANUAL', 'COMPROVANTE_ENVIADO'],
      'Não é possível enviar comprovante neste status',
    );

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(mimeType)) {
      throw new BadRequestException('Tipo de arquivo não permitido');
    }

    if (buffer.length > 5 * 1024 * 1024) {
      throw new BadRequestException('Arquivo excede 5MB');
    }

    const upload = await this.storageService.upload(
      buffer,
      mimeType,
      'pix-receipts',
    );

    const previousStatus = donation.status;
    const newStatus: PixDonationStatus = donation.markedAsPaidAt
      ? 'AGUARDANDO_CONFIRMACAO_MANUAL'
      : 'COMPROVANTE_ENVIADO';

    const updated = await this.prisma.pixDonation.update({
      where: { id },
      data: {
        receiptFileId: upload.fileId,
        status: newStatus,
      },
    });

    await this.prisma.pixPaymentConfirmation.create({
      data: {
        pixDonationId: id,
        action: 'ATTACH_RECEIPT',
        previousStatus,
        newStatus,
      },
    });

    return {
      id: updated.id,
      status: updated.status,
      receipt_file_id: upload.fileId,
    };
  }

  private async findDonationOrThrow(id: string) {
    const donation = await this.prisma.pixDonation.findUnique({
      where: { id },
    });
    if (!donation) {
      throw new NotFoundException('Doação Pix não encontrada');
    }
    return donation;
  }

  private assertNotExpired(expiresAt: Date) {
    if (expiresAt < new Date()) {
      throw new BadRequestException('Pix expirado');
    }
  }

  private assertStatus(
    current: PixDonationStatus,
    allowed: PixDonationStatus[],
    message: string,
  ) {
    if (!allowed.includes(current)) {
      throw new BadRequestException(message);
    }
  }

  private generateTxid(prefix?: string | null): string {
    const base = (prefix ?? 'LD').replace(/[^a-zA-Z0-9]/g, '').slice(0, 5);
    const suffix = randomBytes(8).toString('hex').toUpperCase();
    return `${base}${suffix}`.slice(0, 25);
  }

  private async getActiveSettings(): Promise<PixSetting> {
    const settings = await this.prisma.pixSetting.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });

    if (!settings) {
      throw new NotFoundException('Configurações Pix não encontradas ou inativas');
    }

    return settings;
  }

  private async createDonationWithRetry(params: {
    input: PixDonationInput;
    settings: PixSetting;
    pixPayload: string;
    qrCodeBase64: string;
    txid: string;
    expiresAt: Date;
  }) {
    const data = {
      donorName: params.input.donor_name,
      donorEmail: params.input.donor_email,
      donorPhone: params.input.donor_phone,
      amount: params.input.amount,
      pixPayload: params.pixPayload,
      pixQrCodeBase64: params.qrCodeBase64,
      txid: params.txid,
      status: 'PIX_GERADO' as const,
      wantsPublicMural: params.input.wants_public_mural,
      wantsAnonymous: params.input.wants_anonymous,
      donorMessage: params.input.donor_message,
      expiresAt: params.expiresAt,
    };

    try {
      return await this.prisma.pixDonation.create({ data });
    } catch (error) {
      const prismaError = error as { code?: string };
      if (prismaError.code === 'P2002') {
        const newTxid = this.generateTxid(params.settings.defaultTxid);
        const newPayload = this.pixEmvService.generatePayload({
          pixKey: params.settings.pixKey,
          pixKeyType: params.settings.pixKeyType,
          receiverName: params.settings.receiverName,
          receiverCity: params.settings.receiverCity,
          amount: params.input.amount,
          txid: newTxid,
          description: params.settings.defaultDescription ?? undefined,
        });
        return this.prisma.pixDonation.create({
          data: { ...data, txid: newTxid, pixPayload: newPayload },
        });
      }
      throw error;
    }
  }
}
