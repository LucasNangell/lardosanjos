import { CampaignsService } from './campaigns.service';
import { AuditService } from '../common/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CampaignStatus } from '@prisma/client';

describe('CampaignsService', () => {
  let service: CampaignsService;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(() => {
    prisma = {
      campaign: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      campaignDonation: {
        findMany: jest.fn().mockResolvedValue([
          {
            payment: { value: 100, status: 'CONFIRMED' },
            pixDonation: null,
          },
          {
            payment: null,
            pixDonation: { amount: 50, status: 'AGUARDANDO_CONFIRMACAO_MANUAL' },
          },
        ]),
      },
    } as unknown as jest.Mocked<PrismaService>;

    const audit = { log: jest.fn() } as unknown as AuditService;
    const storage = { upload: jest.fn() } as unknown as StorageService;
    service = new CampaignsService(prisma, audit, storage);
  });

  it('findAllPublic filters by ACTIVE status by default', async () => {
    (prisma.campaign.findMany as jest.Mock).mockResolvedValue([]);

    await service.findAllPublic({});

    expect(prisma.campaign.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: CampaignStatus.ACTIVE },
      }),
    );
  });

  it('calculates raised amount ignoring pending pix', async () => {
    (prisma.campaign.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'c1',
        title: 'Campanha',
        slug: 'campanha',
        description: 'Desc',
        goalAmount: 1000,
        raisedAmount: 0,
        status: 'ACTIVE',
        startsAt: null,
        endsAt: null,
        animal: null,
        coverImage: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const result = await service.findAllPublic({});
    expect(result[0].raisedAmount).toBe(100);
    expect(result[0].progressPercent).toBe(10);
  });
});
