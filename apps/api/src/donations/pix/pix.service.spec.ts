import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PixService } from './pix.service';
import { PixEmvService } from './pix-emv.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';

jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,abc123'),
}));

describe('PixService', () => {
  let service: PixService;
  let prisma: {
    pixSetting: { findFirst: jest.Mock };
    pixDonation: { create: jest.Mock; findUnique: jest.Mock; update: jest.Mock };
    pixPaymentConfirmation: { create: jest.Mock };
  };
  let storage: { upload: jest.Mock };
  let campaignDonations: { linkPixDonation: jest.Mock };

  const activeSettings = {
    id: 'settings-1',
    receiverName: 'Lar dos Anjos Pet',
    receiverCity: 'Brasilia',
    pixKey: '12345678901',
    pixKeyType: 'CPF' as const,
    defaultDescription: 'Doacao',
    defaultTxid: 'LD',
    minAmount: 1,
    allowCustomAmount: true,
    quickAmounts: [10, 25, 50],
    instructions: 'Envie comprovante apos pagar',
    requireDonorData: false,
    requireReceiptUpload: true,
    hideSensitiveDetails: false,
    isActive: true,
    environment: 'SANDBOX',
    createdById: null,
    updatedById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    prisma = {
      pixSetting: {
        findFirst: jest.fn(),
      },
      pixDonation: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      pixPaymentConfirmation: {
        create: jest.fn(),
      },
    };

    storage = {
      upload: jest.fn().mockResolvedValue({ fileId: 'file-1' }),
    };
    campaignDonations = {
      linkPixDonation: jest.fn().mockResolvedValue({ id: 'link-1' }),
    };

    service = new PixService(
      prisma as unknown as PrismaService,
      new PixEmvService(),
      storage as unknown as StorageService,
      campaignDonations as never,
    );
  });

  it('getSettings returns public config without pix key', async () => {
    prisma.pixSetting.findFirst.mockResolvedValue(activeSettings);

    const result = await service.getSettings();

    expect(result.min_amount).toBe(1);
    expect(result.receiver_name).toBe('Lar dos Anjos Pet');
    expect(result).not.toHaveProperty('pix_key');
  });

  it('getSettings hides receiver when hide_sensitive_details', async () => {
    prisma.pixSetting.findFirst.mockResolvedValue({
      ...activeSettings,
      hideSensitiveDetails: true,
    });

    const result = await service.getSettings();
    expect(result.receiver_name).toBeUndefined();
  });

  it('generatePix throws when no active settings', async () => {
    prisma.pixSetting.findFirst.mockResolvedValue(null);

    await expect(
      service.generatePix({ amount: 10 }),
    ).rejects.toThrow(NotFoundException);
  });

  it('generatePix throws when amount below minimum', async () => {
    prisma.pixSetting.findFirst.mockResolvedValue(activeSettings);

    await expect(
      service.generatePix({ amount: 0.5 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('generatePix throws when pix key invalid', async () => {
    prisma.pixSetting.findFirst.mockResolvedValue({
      ...activeSettings,
      pixKey: '123',
    });

    await expect(
      service.generatePix({ amount: 10 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('generatePix persists PIX_GERADO and returns pending response', async () => {
    prisma.pixSetting.findFirst.mockResolvedValue(activeSettings);
    prisma.pixDonation.create.mockResolvedValue({
      id: 'donation-1',
      amount: 25,
      pixPayload: '000201mock',
      pixQrCodeBase64: 'data:image/png;base64,abc',
      txid: 'LD123',
      status: 'PIX_GERADO',
      expiresAt: new Date('2026-12-31'),
    });
    prisma.pixPaymentConfirmation.create.mockResolvedValue({ id: 'conf-1' });

    const result = await service.generatePix({ amount: 25 });

    expect(result.status).toBe('PIX_GERADO');
    expect(result.confirmed).toBe(false);
    expect(result.pending).toBe(true);
    expect(result.pix_payload).toContain('000201');
    expect(result.pix_qr_code_base64).toContain('data:image/png');
    expect(result.instructions).toBe(activeSettings.instructions);
    expect(prisma.pixDonation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'PIX_GERADO' }),
      }),
    );
  });

  it('getStatus returns donation status without confirming payment', async () => {
    prisma.pixDonation.findUnique.mockResolvedValue({
      id: 'donation-1',
      status: 'PIX_GERADO',
      amount: 25,
      markedAsPaidAt: null,
      expiresAt: new Date('2026-12-31'),
      receiptFileId: null,
    });

    const result = await service.getStatus('donation-1');
    expect(result.status).toBe('PIX_GERADO');
    expect(result).not.toHaveProperty('confirmed', true);
  });

  it('generateTxid produces unique values across calls', async () => {
    prisma.pixSetting.findFirst.mockResolvedValue(activeSettings);
    const txids = new Set<string>();

    for (let i = 0; i < 5; i++) {
      prisma.pixDonation.create.mockResolvedValueOnce({
        id: `donation-${i}`,
        amount: 10,
        pixPayload: '000201',
        pixQrCodeBase64: 'data:image/png;base64,x',
        txid: `LD${i}`,
        status: 'PIX_GERADO',
        expiresAt: new Date(),
      });
      prisma.pixPaymentConfirmation.create.mockResolvedValue({ id: `c-${i}` });

      await service.generatePix({ amount: 10 });
      const call = prisma.pixDonation.create.mock.calls[i][0] as {
        data: { txid: string };
      };
      txids.add(call.data.txid);
    }

    expect(txids.size).toBe(5);
  });

  it('markAsPaid transitions to AGUARDANDO_CONFIRMACAO_MANUAL without confirming payment', async () => {
    const future = new Date(Date.now() + 60_000);
    prisma.pixDonation.findUnique.mockResolvedValue({
      id: 'donation-1',
      status: 'PIX_GERADO',
      expiresAt: future,
      markedAsPaidAt: null,
    });
    prisma.pixDonation.update.mockResolvedValue({
      id: 'donation-1',
      status: 'AGUARDANDO_CONFIRMACAO_MANUAL',
      markedAsPaidAt: new Date(),
    });

    const result = await service.markAsPaid('donation-1');

    expect(result.status).toBe('AGUARDANDO_CONFIRMACAO_MANUAL');
    expect(result.status).not.toBe('CONFIRMADO_MANUALMENTE');
    expect(prisma.pixPaymentConfirmation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'MARK_AS_PAID' }),
      }),
    );
  });

  it('uploadReceipt accepts valid pdf and keeps donation pending', async () => {
    const future = new Date(Date.now() + 60_000);
    prisma.pixDonation.findUnique.mockResolvedValue({
      id: 'donation-1',
      status: 'PIX_GERADO',
      expiresAt: future,
      markedAsPaidAt: null,
    });
    prisma.pixDonation.update.mockResolvedValue({
      id: 'donation-1',
      status: 'COMPROVANTE_ENVIADO',
    });

    const buffer = Buffer.alloc(1024);
    const result = await service.uploadReceipt(
      'donation-1',
      buffer,
      'application/pdf',
    );

    expect(result.status).toBe('COMPROVANTE_ENVIADO');
    expect(storage.upload).toHaveBeenCalledWith(
      buffer,
      'application/pdf',
      'pix-receipts',
    );
  });

  it('uploadReceipt rejects invalid mime type', async () => {
    prisma.pixDonation.findUnique.mockResolvedValue({
      id: 'donation-1',
      status: 'PIX_GERADO',
      expiresAt: new Date(Date.now() + 60_000),
      markedAsPaidAt: null,
    });

    await expect(
      service.uploadReceipt('donation-1', Buffer.alloc(10), 'application/x-msdownload'),
    ).rejects.toThrow(BadRequestException);
  });

  it('uploadReceipt rejects file larger than 5MB', async () => {
    prisma.pixDonation.findUnique.mockResolvedValue({
      id: 'donation-1',
      status: 'PIX_GERADO',
      expiresAt: new Date(Date.now() + 60_000),
      markedAsPaidAt: null,
    });

    await expect(
      service.uploadReceipt(
        'donation-1',
        Buffer.alloc(5 * 1024 * 1024 + 1),
        'image/png',
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
