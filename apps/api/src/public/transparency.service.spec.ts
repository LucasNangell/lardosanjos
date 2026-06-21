import { TransparencyService } from './transparency.service';
import { PrismaService } from '../prisma/prisma.service';
import { CONFIRMED_PIX_STATUS } from '../common/constants/finance.constants';

describe('TransparencyService', () => {
  let service: TransparencyService;
  let prisma: {
    payment: { aggregate: jest.Mock };
    pixDonation: { aggregate: jest.Mock };
    expense: { aggregate: jest.Mock; findMany: jest.Mock };
    subscription: { count: jest.Mock };
    systemSetting: { findUnique: jest.Mock };
    transparencyReport: { findMany: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      payment: { aggregate: jest.fn() },
      pixDonation: { aggregate: jest.fn() },
      expense: { aggregate: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
      subscription: { count: jest.fn().mockResolvedValue(3) },
      systemSetting: { findUnique: jest.fn().mockResolvedValue(null) },
      transparencyReport: { findMany: jest.fn().mockResolvedValue([]) },
    };

    prisma.payment.aggregate.mockResolvedValue({ _sum: { value: { toString: () => '100' } } });
    prisma.pixDonation.aggregate.mockResolvedValue({ _sum: { amount: { toString: () => '50' } } });
    prisma.expense.aggregate.mockResolvedValue({ _sum: { amount: { toString: () => '30' } } });

    service = new TransparencyService(prisma as unknown as PrismaService);
  });

  it('sums only confirmed asaas and pix manual for totals', async () => {
    const result = await service.getSummary();

    expect(result.total_income).toBe(150);
    expect(result.income_by_source.asaas).toBe(100);
    expect(result.income_by_source.pix_manual).toBe(50);
    expect(result.confirmed_statuses.pix).toEqual([CONFIRMED_PIX_STATUS]);
  });

  it('excludes pending pix from totals when aggregate returns zero', async () => {
    prisma.pixDonation.aggregate.mockResolvedValue({ _sum: { amount: null } });
    prisma.payment.aggregate.mockResolvedValue({ _sum: { value: null } });
    prisma.expense.aggregate.mockResolvedValue({ _sum: { amount: null } });

    const result = await service.getSummary();

    expect(result.total_income).toBe(0);
    expect(result.data_state).toBe('empty');
  });

  it('returns public expenses only', async () => {
    prisma.expense.findMany.mockResolvedValue([
      {
        id: 'exp-1',
        title: 'Ração',
        publicDescription: 'Compra mensal',
        amount: { toString: () => '200.00' },
        date: new Date('2026-06-01'),
        category: { id: 'cat-1', name: 'Ração', icon: 'utensils', color: '#B9895D' },
      },
    ]);

    const result = await service.getPublicExpenses();

    expect(result.items).toHaveLength(1);
    expect(result.items[0].amount).toBe(200);
    expect(prisma.expense.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isPublic: true },
      }),
    );
  });

  it('calculates goal progress from monthly income', async () => {
    const result = await service.getSummary();

    expect(result.monthly_goal).toBeGreaterThan(0);
    expect(result.goal_progress_percent).toBeGreaterThanOrEqual(0);
    expect(result.active_donors).toBe(3);
  });
});
