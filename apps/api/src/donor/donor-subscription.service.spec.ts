import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { DonorSubscriptionService } from './donor-subscription.service';
import { PrismaService } from '../prisma/prisma.service';
import { AsaasService } from '../integrations/asaas/asaas.service';
import { DonorService } from './donor.service';
import { DonorCardService } from './donor-card.service';
import { AuditService } from '../common/audit.service';
import { AsaasApiError } from '../integrations/asaas/asaas.errors';
import { CancelSubscriptionReasonDto } from './dto/donor-subscription.dto';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('DonorSubscriptionService', () => {
  let service: DonorSubscriptionService;
  let prisma: {
    subscription: { findFirst: jest.Mock; update: jest.Mock };
    donationPlan: { findUnique: jest.Mock };
    user: { findUnique: jest.Mock };
    donorCard: { updateMany: jest.Mock };
  };
  let asaas: {
    updateSubscription: jest.Mock;
    cancelSubscription: jest.Mock;
    updateSubscriptionCreditCard: jest.Mock;
  };
  let donorService: { getActiveSubscription: jest.Mock };
  let audit: { log: jest.Mock };

  const donor = {
    id: 'donor-1',
    userId: 'user-1',
    fullName: 'Maria',
    email: 'maria@test.com',
  };

  const subscription = {
    id: 'sub-1',
    donorId: 'donor-1',
    planId: 'plan-1',
    asaasSubscriptionId: 'asaas_sub_1',
    billingType: 'CREDIT_CARD',
    value: 19.9,
    status: 'ACTIVE',
    nextDueDate: new Date('2026-07-01'),
    startedAt: new Date('2026-01-01'),
  };

  beforeEach(() => {
    prisma = {
      subscription: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      donationPlan: { findUnique: jest.fn() },
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-1',
          passwordHash: 'hash',
        }),
      },
      donorCard: { updateMany: jest.fn() },
    };
    asaas = {
      updateSubscription: jest.fn(),
      cancelSubscription: jest.fn(),
      updateSubscriptionCreditCard: jest.fn(),
    };
    donorService = {
      getActiveSubscription: jest.fn().mockResolvedValue(subscription),
    };
    audit = { log: jest.fn() };

    service = new DonorSubscriptionService(
      prisma as unknown as PrismaService,
      asaas as unknown as AsaasService,
      donorService as unknown as DonorService,
      {} as DonorCardService,
      audit as unknown as AuditService,
    );

    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  it('returns active subscription for donor', async () => {
    prisma.subscription.findFirst.mockResolvedValue({
      ...subscription,
      plan: {
        id: 'plan-1',
        name: 'Anjo Ração',
        slug: 'anjo-racao',
        value: 19.9,
        description: 'desc',
      },
    });

    const result = await service.getSubscription(donor as never);

    expect(result.subscription?.plan.name).toBe('Anjo Ração');
    expect(prisma.subscription.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ donorId: 'donor-1' }),
      }),
    );
  });

  it('changes plan via Asaas and audits', async () => {
    prisma.donationPlan.findUnique.mockResolvedValue({
      id: 'plan-2',
      name: 'Anjo Cuidado',
      isActive: true,
      value: 39.9,
    });
    asaas.updateSubscription.mockResolvedValue({
      status: 'ACTIVE',
      nextDueDate: '2026-08-01',
    });
    prisma.subscription.update.mockResolvedValue({
      ...subscription,
      planId: 'plan-2',
      value: 39.9,
      plan: { id: 'plan-2', name: 'Anjo Cuidado', value: 39.9 },
    });

    const result = await service.updatePlan(
      donor as never,
      { plan_id: 'plan-2', password: 'secret1' },
      'user-1',
    );

    expect(result.change_type).toBe('upgrade');
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'DONOR_SUBSCRIPTION_CHANGE_PLAN' }),
    );
  });

  it('cancels on Asaas before updating local status', async () => {
    asaas.cancelSubscription.mockResolvedValue({ status: 'INACTIVE' });
    prisma.subscription.update.mockResolvedValue({
      ...subscription,
      status: 'CANCELED',
      canceledAt: new Date(),
      cancelReason: 'code:FINANCIAL',
    });

    const result = await service.cancel(
      donor as never,
      { password: 'secret1', reason_code: CancelSubscriptionReasonDto.FINANCIAL },
      'user-1',
    );

    expect(asaas.cancelSubscription).toHaveBeenCalledWith('asaas_sub_1');
    expect(result.status).toBe('CANCELED');
    expect(audit.log).toHaveBeenCalled();
  });

  it('does not cancel locally when Asaas fails', async () => {
    asaas.cancelSubscription.mockRejectedValue(
      new AsaasApiError('Falha Asaas', 503),
    );

    await expect(
      service.cancel(
        donor as never,
        { password: 'secret1' },
        'user-1',
      ),
    ).rejects.toThrow(ServiceUnavailableException);

    expect(prisma.subscription.update).not.toHaveBeenCalled();
  });

  it('rejects wrong password', async () => {
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.cancel(donor as never, { password: 'wrong' }, 'user-1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('pause is not supported and returns clear message', async () => {
    await expect(
      service.pause(donor as never, { password: 'secret1' }, 'user-1'),
    ).rejects.toThrow(/Pausa temporária não está disponível/);
  });
});
