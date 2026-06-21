import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PixKeyType } from '@lardosanjos/database';
import { PixSettingsService } from './pix-settings.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit.service';
import { PixEmvService } from '../../donations/pix/pix-emv.service';

jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,testqr'),
}));

describe('PixSettingsService', () => {
  let service: PixSettingsService;
  let prisma: {
    pixSetting: {
      findFirst: jest.Mock;
      update: jest.Mock;
      create: jest.Mock;
    };
  };
  let audit: { log: jest.Mock };
  let pixEmv: { generatePayload: jest.Mock };

  const settings = {
    id: 'pix-1',
    receiverName: 'Lar dos Anjos Pet',
    receiverCity: 'BRASILIA',
    pixKey: 'contato@lardosanjos.online',
    pixKeyType: PixKeyType.EMAIL,
    defaultDescription: 'Doacao',
    defaultTxid: 'LD',
    minAmount: 10,
    allowCustomAmount: true,
    quickAmounts: [10, 25, 50],
    instructions: 'Envie comprovante',
    requireDonorData: false,
    requireReceiptUpload: true,
    hideSensitiveDetails: true,
    isActive: true,
    environment: 'SANDBOX',
    updatedAt: new Date('2026-01-01'),
  };

  beforeEach(() => {
    prisma = {
      pixSetting: {
        findFirst: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
    };
    audit = { log: jest.fn() };
    pixEmv = {
      generatePayload: jest.fn().mockReturnValue('00020126580014BR.GOV.BCB.PIX'),
    };

    service = new PixSettingsService(
      prisma as unknown as PrismaService,
      audit as unknown as AuditService,
      pixEmv as unknown as PixEmvService,
    );
  });

  it('returns masked key for read-only admin', async () => {
    prisma.pixSetting.findFirst.mockResolvedValue(settings);

    const result = await service.getSettings('user-read', false);

    expect(result.pix_key).toContain('•');
    expect(result.pix_key).not.toBe(settings.pixKey);
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PIX_SETTINGS_READ_MASKED' }),
    );
  });

  it('returns full key for write admin', async () => {
    prisma.pixSetting.findFirst.mockResolvedValue(settings);

    const result = await service.getSettings('user-write', true);

    expect(result.pix_key).toBe(settings.pixKey);
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PIX_SETTINGS_READ' }),
    );
  });

  it('saves settings and audits update', async () => {
    prisma.pixSetting.findFirst.mockResolvedValue(settings);
    prisma.pixSetting.update.mockResolvedValue({
      ...settings,
      receiverName: 'Lar dos Anjos',
    });

    const result = await service.updateSettings(
      {
        receiver_name: 'Lar dos Anjos',
        receiver_city: 'Brasilia',
        pix_key: 'contato@lardosanjos.online',
        pix_key_type: PixKeyType.EMAIL,
        min_amount: 10,
        allow_custom_amount: true,
        quick_amounts: [10, 25],
        require_donor_data: false,
        require_receipt_upload: true,
        hide_sensitive_details: true,
        is_active: true,
        environment: 'SANDBOX',
      },
      'user-write',
      '127.0.0.1',
    );

    expect(result.receiver_name).toBe('Lar dos Anjos');
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'PIX_SETTINGS_UPDATE',
        newData: expect.objectContaining({ pix_key: '[REDACTED]' }),
      }),
    );
  });

  it('rejects invalid pix key', async () => {
    prisma.pixSetting.findFirst.mockResolvedValue(null);

    await expect(
      service.updateSettings(
        {
          receiver_name: 'Lar dos Anjos',
          receiver_city: 'Brasilia',
          pix_key: 'invalid-email',
          pix_key_type: PixKeyType.EMAIL,
          min_amount: 10,
          allow_custom_amount: true,
          require_donor_data: false,
          require_receipt_upload: true,
          hide_sensitive_details: false,
          is_active: true,
        },
        'user-write',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('generates test QR payload without Asaas', async () => {
    prisma.pixSetting.findFirst.mockResolvedValue(settings);

    const result = await service.testSettings({ amount: 10 });

    expect(result.pix_payload).toContain('BR.GOV.BCB.PIX');
    expect(result.pix_qr_code_base64).toContain('data:image/png');
    expect(pixEmv.generatePayload).toHaveBeenCalled();
  });

  it('throws when settings are missing for test', async () => {
    prisma.pixSetting.findFirst.mockResolvedValue(null);

    await expect(service.testSettings({ amount: 10 })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('throws not found when no settings exist', async () => {
    prisma.pixSetting.findFirst.mockResolvedValue(null);

    await expect(service.getSettings('user', false)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
