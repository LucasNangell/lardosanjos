import { BadRequestException } from '@nestjs/common';
import { DonorPublicDisplayType } from '@lardosanjos/database';
import { DonorCardService } from './donor-card.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit.service';

jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,abc'),
  toBuffer: jest.fn().mockResolvedValue(Buffer.from('png')),
}));

describe('DonorCardService', () => {
  let service: DonorCardService;
  let prisma: {
    donorCard: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    subscription: { findFirst: jest.Mock };
    donor: { findUnique: jest.Mock; update: jest.Mock };
  };
  let audit: { log: jest.Mock };

  const donorId = 'donor-1';
  const userId = 'user-1';

  const donor = {
    id: donorId,
    fullName: 'Maria Silva',
    publicName: null,
    publicDisplayType: DonorPublicDisplayType.ANONYMOUS,
    wantsPublicProfile: false,
    subscriptions: [
      {
        status: 'ACTIVE',
        startedAt: new Date('2025-01-15'),
        plan: { id: 'plan-1', name: 'Anjo Prata', slug: 'anjo-prata' },
      },
    ],
    donorBadges: [],
  };

  const card = {
    id: 'card-1',
    donorId,
    cardNumber: 'LD-0001-0002-0003',
    status: 'ACTIVE',
    qrCodeSecret: 'a'.repeat(48),
    createdAt: new Date('2025-02-01'),
  };

  beforeEach(() => {
    prisma = {
      donorCard: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      subscription: { findFirst: jest.fn() },
      donor: { findUnique: jest.fn(), update: jest.fn() },
    };
    audit = { log: jest.fn() };

    service = new DonorCardService(
      prisma as unknown as PrismaService,
      audit as unknown as AuditService,
    );

    process.env.WEB_URL = 'http://localhost:3000';
  });

  it('generates card for active subscriber and audits', async () => {
    prisma.subscription.findFirst.mockResolvedValue({ id: 'sub-1' });
    prisma.donorCard.findFirst.mockResolvedValue(null);
    prisma.donorCard.create.mockResolvedValue(card);
    prisma.donor.findUnique.mockResolvedValue(donor);

    const result = await service.generateCard(donorId, userId, '127.0.0.1');

    expect(result.card_number).toBe(card.cardNumber);
    expect(result.display_name).toBe('Anjo anônimo');
    expect(result.valid).toBe(true);
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'DONOR_CARD_GENERATE' }),
    );
  });

  it('rejects generation without active subscription', async () => {
    prisma.subscription.findFirst.mockResolvedValue(null);

    await expect(service.generateCard(donorId, userId)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('returns card for donor with active subscription', async () => {
    prisma.donor.findUnique.mockResolvedValue(donor);
    prisma.donorCard.findFirst.mockResolvedValue(card);

    const result = await service.getCardForDonor(donorId);

    expect(result?.display_name).toBe('Anjo anônimo');
    expect(result?.qr_code_data_url).toContain('data:image/png');
    expect(result?.validation_url).toContain('/anjo/validar/');
  });

  it('marks card inactive when subscription is canceled', async () => {
    prisma.donor.findUnique.mockResolvedValue({
      ...donor,
      subscriptions: [],
    });
    prisma.donorCard.findFirst.mockResolvedValue(card);
    prisma.donorCard.update.mockResolvedValue({ ...card, status: 'INACTIVE' });

    const result = await service.getCardForDonor(donorId);

    expect(prisma.donorCard.update).toHaveBeenCalled();
    expect(result?.valid).toBe(false);
    expect(result?.status_label).toBe('Inativa');
  });

  it('validates card publicly without sensitive data', async () => {
    prisma.donorCard.findUnique.mockResolvedValue({
      ...card,
      donor,
    });

    const result = await service.validateCard(
      card.cardNumber,
      card.qrCodeSecret,
    );

    expect(result.valid).toBe(true);
    expect(result).toMatchObject({
      display_name: 'Anjo anônimo',
      plan_name: 'Anjo Prata',
    });
    expect(result).not.toHaveProperty('email');
    expect(result).not.toHaveProperty('cpf');
  });

  it('rejects validation without token', async () => {
    prisma.donorCard.findUnique.mockResolvedValue({
      ...card,
      donor,
    });

    const result = await service.validateCard(card.cardNumber);

    expect(result.valid).toBe(false);
  });

  it('reactivates existing inactive card', async () => {
    prisma.donorCard.findFirst.mockResolvedValue({
      ...card,
      status: 'INACTIVE',
    });
    prisma.donorCard.update.mockResolvedValue({ ...card, status: 'ACTIVE' });

    const result = await service.ensureActiveCard(donorId);

    expect(prisma.donorCard.update).toHaveBeenCalled();
    expect(result.status).toBe('ACTIVE');
  });
});
