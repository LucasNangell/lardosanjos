import { BadgesService } from './badges.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit.service';

describe('BadgesService', () => {
  let service: BadgesService;
  let prisma: {
    badge: { findMany: jest.Mock; findFirst: jest.Mock; findUnique: jest.Mock };
    donorBadge: { findUnique: jest.Mock; create: jest.Mock; upsert: jest.Mock; findMany: jest.Mock };
    donor: { findMany: jest.Mock };
    payment: { count: jest.Mock; aggregate: jest.Mock };
    pixDonation: { count: jest.Mock; aggregate: jest.Mock };
    subscription: { findFirst: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      badge: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      donorBadge: {
        findUnique: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn(),
        findMany: jest.fn(),
      },
      donor: { findMany: jest.fn() },
      payment: { count: jest.fn(), aggregate: jest.fn() },
      pixDonation: { count: jest.fn(), aggregate: jest.fn() },
      subscription: { findFirst: jest.fn() },
    };

    service = new BadgesService(
      prisma as unknown as PrismaService,
      { log: jest.fn() } as unknown as AuditService,
    );
  });

  it('awards first donation badge when donor has confirmed payment', async () => {
    prisma.badge.findMany.mockResolvedValue([
      { id: 'b1', ruleType: 'FIRST_DONATION', ruleValue: 1 },
    ]);
    prisma.donorBadge.findUnique.mockResolvedValue(null);
    prisma.payment.count.mockResolvedValue(1);
    prisma.pixDonation.count.mockResolvedValue(0);
    prisma.donorBadge.create.mockResolvedValue({ id: 'db1' });

    const awarded = await service.evaluateDonor('donor-1');
    expect(awarded).toBe(1);
  });

  it('awards campaign supporter badge', async () => {
    prisma.badge.findFirst.mockResolvedValue({ id: 'camp-badge' });
    prisma.donorBadge.upsert.mockResolvedValue({ id: 'db2' });

    await service.awardCampaignSupporter('donor-1');
    expect(prisma.donorBadge.upsert).toHaveBeenCalled();
  });
});
