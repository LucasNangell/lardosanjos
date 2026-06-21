import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as QRCode from 'qrcode';
import { PixKeyType } from '@lardosanjos/database';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit.service';
import { PixEmvService } from '../../donations/pix/pix-emv.service';
import {
  assertValidPixKey,
  parseQuickAmounts,
} from '../../donations/pix/pix-key.validator';
import { TestPixSettingsDto, UpdatePixSettingsDto } from './pix-settings.dto';
import {
  maskPixKey,
  sanitizePixSettingsForAudit,
} from './pix-settings.utils';

@Injectable()
export class PixSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly pixEmvService: PixEmvService,
  ) {}

  async getSettings(userId: string, canWrite: boolean, ip?: string) {
    const settings = await this.prisma.pixSetting.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (!settings) {
      throw new NotFoundException('Configurações Pix não encontradas');
    }

    const response = this.toResponse(settings, canWrite);

    await this.auditService.log({
      userId,
      action: canWrite ? 'PIX_SETTINGS_READ' : 'PIX_SETTINGS_READ_MASKED',
      entity: 'pix_settings',
      entityId: settings.id,
      newData: sanitizePixSettingsForAudit(response),
      ipAddress: ip,
    });

    return response;
  }

  async updateSettings(dto: UpdatePixSettingsDto, userId: string, ip?: string) {
    const existing = await this.prisma.pixSetting.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    let pixKey = dto.pix_key.trim();
    if (pixKey.includes('•')) {
      if (!existing) {
        throw new BadRequestException('Informe a chave Pix completa.');
      }
      pixKey = existing.pixKey;
    }

    assertValidPixKey(pixKey, dto.pix_key_type);
    this.assertValidActiveConfig({ ...dto, pix_key: pixKey });

    const data = {
      receiverName: dto.receiver_name.trim(),
      receiverCity: dto.receiver_city.trim().toUpperCase(),
      pixKey,
      pixKeyType: dto.pix_key_type,
      defaultDescription: dto.default_description?.trim() || null,
      defaultTxid: dto.default_txid?.trim() || null,
      minAmount: dto.min_amount,
      allowCustomAmount: dto.allow_custom_amount,
      quickAmounts: dto.quick_amounts ?? [],
      instructions: dto.instructions?.trim() || null,
      requireDonorData: dto.require_donor_data,
      requireReceiptUpload: dto.require_receipt_upload,
      hideSensitiveDetails: dto.hide_sensitive_details,
      isActive: dto.is_active,
      environment: dto.environment ?? 'PRODUCTION',
      updatedById: userId,
    };

    const settings = existing
      ? await this.prisma.pixSetting.update({
          where: { id: existing.id },
          data,
        })
      : await this.prisma.pixSetting.create({
          data: { ...data, createdById: userId },
        });

    await this.auditService.log({
      userId,
      action: 'PIX_SETTINGS_UPDATE',
      entity: 'pix_settings',
      entityId: settings.id,
      oldData: existing
        ? sanitizePixSettingsForAudit(this.toResponse(existing, true))
        : null,
      newData: sanitizePixSettingsForAudit(this.toResponse(settings, true)),
      ipAddress: ip,
    });

    return this.toResponse(settings, true);
  }

  async testSettings(dto: TestPixSettingsDto) {
    const saved = await this.prisma.pixSetting.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    const pixKey = dto.pix_key?.trim() || saved?.pixKey;
    const pixKeyType = dto.pix_key_type || saved?.pixKeyType;
    const receiverName = dto.receiver_name?.trim() || saved?.receiverName;
    const receiverCity = dto.receiver_city?.trim() || saved?.receiverCity;
    const defaultDescription =
      dto.default_description ?? saved?.defaultDescription ?? 'Teste Pix Lar dos Anjos';
    const defaultTxid = dto.default_txid ?? saved?.defaultTxid;

    if (!pixKey || !pixKeyType || !receiverName || !receiverCity) {
      throw new BadRequestException(
        'Informe os dados Pix necessários ou salve a configuração antes de testar.',
      );
    }

    assertValidPixKey(pixKey, pixKeyType);

    const amount = dto.amount ?? Number(saved?.minAmount ?? 1);
    const txid = this.generateTestTxid(defaultTxid);
    const payload = this.pixEmvService.generatePayload({
      pixKey,
      pixKeyType,
      receiverName,
      receiverCity: receiverCity.toUpperCase(),
      amount,
      txid,
      description: defaultDescription,
    });

    const pixQrCodeBase64 = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 280,
    });

    return {
      amount,
      txid,
      pix_payload: payload,
      pix_qr_code_base64: pixQrCodeBase64,
      valid: payload.length > 0,
      message: 'QR Code de teste gerado. Use o Pix Copia e Cola ou escaneie a imagem.',
    };
  }

  private assertValidActiveConfig(dto: UpdatePixSettingsDto) {
    if (!dto.receiver_name.trim() || !dto.receiver_city.trim()) {
      throw new BadRequestException(
        'Nome e cidade do recebedor são obrigatórios.',
      );
    }

    const quickAmounts = parseQuickAmounts(dto.quick_amounts);
    if (quickAmounts.some((value) => value < dto.min_amount)) {
      throw new BadRequestException(
        'Valores rápidos não podem ser menores que o valor mínimo.',
      );
    }

    if (dto.is_active) {
      assertValidPixKey(dto.pix_key, dto.pix_key_type);
    }
  }

  private toResponse(
    settings: {
      id: string;
      receiverName: string;
      receiverCity: string;
      pixKey: string;
      pixKeyType: PixKeyType;
      defaultDescription: string | null;
      defaultTxid: string | null;
      minAmount: unknown;
      allowCustomAmount: boolean;
      quickAmounts: unknown;
      instructions: string | null;
      requireDonorData: boolean;
      requireReceiptUpload: boolean;
      hideSensitiveDetails: boolean;
      isActive: boolean;
      environment: string;
      updatedAt: Date;
    },
    canWrite: boolean,
  ) {
    const maskKey = canWrite
      ? settings.pixKey
      : maskPixKey(settings.pixKey, settings.pixKeyType);

    return {
      id: settings.id,
      receiver_name: settings.receiverName,
      receiver_city: settings.receiverCity,
      pix_key: maskKey,
      pix_key_masked: maskKey !== settings.pixKey,
      pix_key_type: settings.pixKeyType,
      default_description: settings.defaultDescription,
      default_txid: settings.defaultTxid,
      min_amount: Number(settings.minAmount),
      allow_custom_amount: settings.allowCustomAmount,
      quick_amounts: parseQuickAmounts(settings.quickAmounts),
      instructions: settings.instructions,
      require_donor_data: settings.requireDonorData,
      require_receipt_upload: settings.requireReceiptUpload,
      hide_sensitive_details: settings.hideSensitiveDetails,
      is_active: settings.isActive,
      environment: settings.environment,
      updated_at: settings.updatedAt.toISOString(),
    };
  }

  private generateTestTxid(prefix?: string | null): string {
    const base = (prefix ?? 'TST').replace(/[^a-zA-Z0-9]/g, '').slice(0, 5);
    const suffix = randomBytes(4).toString('hex').toUpperCase();
    return `${base}${suffix}`.slice(0, 25);
  }
}
