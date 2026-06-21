import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PixDonationsService } from './pix-donations.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit.service';
import { StorageService } from '../../storage/storage.service';
import { createReceiptAccessToken } from './pix-receipt-access.util';

describe('PixDonationsService', () => {
  let service: PixDonationsService;
  let prisma: {
    pixDonation: {
      findMany: jest.Mock;
      count: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    pixPaymentConfirmation: { create: jest.Mock };
    publicMuralEntry: { findFirst: jest.Mock; create: jest.Mock };
    $transaction: jest.Mock;
  };
  let audit: { log: jest.Mock };
  let storage: { getFileBuffer: jest.Mock };
  let badges: { evaluateDonor: jest.Mock; awardCampaignSupporter: jest.Mock };
  let campaignDonations: { getCampaignIdForPix: jest.Mock };

  const donation = {
    id: 'pix-1',
    donorId: null,
    donorName: 'Maria',
    donorEmail: 'maria@test.com',
    donorPhone: '61999999999',
    donorMessage: 'Obrigada',
    amount: 50,
    txid: 'LDTEST123',
    status: 'AGUARDANDO_CONFIRMACAO_MANUAL',
    wantsPublicMural: true,
    wantsAnonymous: false,
    receiptFileId: 'file-1',
    markedAsPaidAt: new Date('2026-06-01'),
    manuallyConfirmedAt: null,
    manuallyConfirmedById: null,
    rejectedAt: null,
    rejectedById: null,
    rejectionReason: null,
    expiresAt: new Date('2026-06-10'),
    createdAt: new Date('2026-06-01'),
  };

  beforeEach(() => {
    prisma = {
      pixDonation: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      pixPaymentConfirmation: { create: jest.fn() },
      publicMuralEntry: { findFirst: jest.fn(), create: jest.fn() },
      $transaction: jest.fn(async (cb) =>
        cb({
          pixDonation: {
            update: prisma.pixDonation.update,
          },
          pixPaymentConfirmation: prisma.pixPaymentConfirmation,
          publicMuralEntry: prisma.publicMuralEntry,
        }),
      ),
    };
    audit = { log: jest.fn() };
    storage = { getFileBuffer: jest.fn() };
    badges = {
      evaluateDonor: jest.fn(),
      awardCampaignSupporter: jest.fn(),
    };
    campaignDonations = {
      getCampaignIdForPix: jest.fn().mockResolvedValue(null),
    };

    service = new PixDonationsService(
      prisma as unknown as PrismaService,
      audit as unknown as AuditService,
      storage as unknown as StorageService,
      badges as never,
      campaignDonations as never,
    );
  });

  it('lists pending pix donations', async () => {
    prisma.pixDonation.findMany.mockResolvedValue([donation]);
    prisma.pixDonation.count.mockResolvedValue(1);

    const result = await service.list({ status: 'AGUARDANDO_CONFIRMACAO_MANUAL' });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].amount).toBe(50);
  });

  it('confirms pix and creates mural entry in transaction', async () => {
    prisma.pixDonation.findUnique.mockResolvedValue(donation);
    prisma.pixDonation.update.mockResolvedValue({
      ...donation,
      status: 'CONFIRMADO_MANUALMENTE',
    });
    prisma.publicMuralEntry.findFirst.mockResolvedValue(null);

    const result = await service.confirm('pix-1', 'admin-1', {}, '127.0.0.1');

    expect(result.status).toBe('CONFIRMADO_MANUALMENTE');
    expect(prisma.pixPaymentConfirmation.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'CONFIRM' }) }),
    );
    expect(prisma.publicMuralEntry.create).toHaveBeenCalled();
    expect(audit.log).toHaveBeenCalled();
  });

  it('rejects pix with mandatory reason', async () => {
    prisma.pixDonation.findUnique.mockResolvedValue(donation);
    prisma.pixDonation.update.mockResolvedValue({
      ...donation,
      status: 'REJEITADO',
    });

    await expect(
      service.reject('pix-1', 'admin-1', {}),
    ).rejects.toBeInstanceOf(BadRequestException);

    const result = await service.reject('pix-1', 'admin-1', {
      rejection_reason: 'Comprovante inválido',
    });

    expect(result.status).toBe('REJEITADO');
    expect(prisma.pixPaymentConfirmation.create).toHaveBeenCalled();
  });

  it('marks duplicate without confirming', async () => {
    prisma.pixDonation.findUnique.mockResolvedValue(donation);
    prisma.pixDonation.update.mockResolvedValue({
      ...donation,
      status: 'DUPLICADO',
    });

    const result = await service.markDuplicate('pix-1', 'admin-1', { note: 'Duplicado' });

    expect(result.status).toBe('DUPLICADO');
  });

  it('blocks confirm on already confirmed donation', async () => {
    prisma.pixDonation.findUnique.mockResolvedValue({
      ...donation,
      status: 'CONFIRMADO_MANUALMENTE',
    });

    await expect(service.confirm('pix-1', 'admin-1', {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('creates signed receipt url for admin', async () => {
    prisma.pixDonation.findUnique.mockResolvedValue({
      ...donation,
      receiptFile: { id: 'file-1', mimeType: 'image/png' },
    });

    const result = await service.getReceiptAccessUrl('pix-1', 'admin-1');

    expect(result.url).toContain('/admin/pix/receipts/');
    expect(result.mime_type).toBe('image/png');
  });

  it('streams receipt only with valid token', async () => {
    prisma.pixDonation.findUnique.mockResolvedValue({
      ...donation,
      receiptFileId: 'file-1',
    });
    storage.getFileBuffer.mockResolvedValue({
      buffer: Buffer.from('png'),
      mimeType: 'image/png',
      fileName: 'receipt.png',
    });

    const token = createReceiptAccessToken({
      fileId: 'file-1',
      donationId: 'pix-1',
      adminUserId: 'admin-1',
    });

    const file = await service.streamReceipt(token);
    expect(file.mimeType).toBe('image/png');

    await expect(service.streamReceipt('invalid')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
