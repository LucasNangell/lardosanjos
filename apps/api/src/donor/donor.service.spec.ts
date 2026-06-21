import { DonorService } from './donor.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit.service';

describe('DonorService', () => {
  let service: DonorService;
  let prisma: {
    payment: { findMany: jest.Mock };
    pixDonation: { findMany: jest.Mock };
    subscription: { findFirst: jest.Mock };
    donorBadge: { findMany: jest.Mock };
    donor: { update: jest.Mock };
  };
  let audit: { log: jest.Mock };

  const donor = {
    id: 'donor-1',
    userId: 'user-1',
    fullName: 'Maria Silva',
    publicName: null,
    email: 'maria@test.com',
    phone: '61999999999',
    cpfCnpj: '24971563792',
    birthDate: null,
    zipCode: null,
    address: null,
    addressNumber: null,
    addressComplement: null,
    neighborhood: null,
    city: null,
    state: null,
    wantsPublicProfile: false,
    publicDisplayType: 'ANONYMOUS' as const,
    communicationEmail: true,
    communicationWhatsapp: false,
    asaasCustomerId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    prisma = {
      payment: { findMany: jest.fn() },
      pixDonation: { findMany: jest.fn() },
      subscription: { findFirst: jest.fn() },
      donorBadge: { findMany: jest.fn() },
      donor: { update: jest.fn() },
    };
    audit = { log: jest.fn() };

    service = new DonorService(
      prisma as unknown as PrismaService,
      audit as unknown as AuditService,
    );
  });

  it('masks cpf in profile response', () => {
    const profile = service.getProfile(donor as never);
    expect(profile.cpf_cnpj).toBe('***.***.***-92');
    expect(profile.cpf_cnpj).not.toContain('24971563792');
  });

  it('listDonations returns only confirmed payments and pix for donor', async () => {
    prisma.payment.findMany.mockResolvedValue([
      {
        id: 'pay-1',
        type: 'ONETIME',
        billingType: 'CREDIT_CARD',
        value: 50,
        status: 'CONFIRMED',
        paidAt: new Date('2026-06-01'),
        receivedAt: null,
        createdAt: new Date('2026-06-01'),
      },
    ]);
    prisma.pixDonation.findMany.mockResolvedValue([
      {
        id: 'pix-1',
        amount: 25,
        status: 'CONFIRMADO_MANUALMENTE',
        manuallyConfirmedAt: new Date('2026-05-01'),
        createdAt: new Date('2026-05-01'),
      },
    ]);

    const result = await service.listDonations(donor as never);

    expect(prisma.payment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          donorId: 'donor-1',
          status: { in: ['RECEIVED', 'CONFIRMED'] },
        }),
      }),
    );
    expect(prisma.pixDonation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          donorId: 'donor-1',
          status: 'CONFIRMADO_MANUALMENTE',
        }),
      }),
    );
    expect(result.total).toBe(2);
    expect(result.items.some((i) => i.source === 'pix')).toBe(true);
    expect(result.items.some((i) => i.source === 'asaas')).toBe(true);
  });

  it('getImpact sums only confirmed donations', async () => {
    prisma.payment.findMany.mockResolvedValue([
      { value: 50, type: 'ONETIME', createdAt: new Date('2026-06-01') },
      { value: 19.9, type: 'RECURRING', createdAt: new Date('2026-05-01') },
    ]);
    prisma.pixDonation.findMany.mockResolvedValue([{ amount: 30 }]);
    prisma.subscription.findFirst.mockResolvedValue(null);
    prisma.donorBadge.findMany.mockResolvedValue([]);

    const impact = await service.getImpact(donor as never);

    expect(impact.total_confirmed).toBeCloseTo(99.9);
    expect(impact.pending_note).toMatch(/pendentes/i);
  });

  it('updatePrivacyPreferences saves preferences and audits', async () => {
    prisma.donor.update.mockResolvedValue({
      ...donor,
      wantsPublicProfile: true,
      publicDisplayType: 'FULL_NAME',
    });

    const result = await service.updatePrivacyPreferences(
      donor as never,
      {
        wants_public_profile: true,
        public_display_type: 'FULL_NAME',
      },
      'user-1',
      '127.0.0.1',
    );

    expect(result.wants_public_profile).toBe(true);
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'DONOR_PRIVACY_UPDATE',
        entityId: 'donor-1',
      }),
    );
  });
});
