import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AsaasService } from '../../integrations/asaas/asaas.service';
import { DonorsService } from '../donors/donors.service';
import { AsaasApiError } from '../../integrations/asaas/asaas.errors';
import { SubscriptionBillingTypeDto } from './subscription.dto';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let prisma: {
    donationPlan: { findUnique: jest.Mock };
    donor: { update: jest.Mock };
    subscription: { create: jest.Mock };
  };
  let asaas: { createSubscription: jest.Mock };
  let donors: { findOrCreate: jest.Mock };

  const activePlan = {
    id: 'plan-1',
    name: 'Anjo Ração',
    slug: 'anjo-racao',
    value: 19.9,
    isActive: true,
  };

  const customPlan = {
    id: 'plan-custom',
    name: 'Valor Personalizado',
    slug: 'valor-personalizado',
    value: 10,
    isActive: true,
  };

  const baseDto = {
    plan_id: 'plan-1',
    donor_name: 'Maria Silva',
    donor_email: 'maria@test.com',
    donor_phone: '61999999999',
    cpf_cnpj: '24971563792',
    billing_type: SubscriptionBillingTypeDto.BOLETO,
    accepts_terms: true,
    accepts_privacy: true,
    wants_public_mural: false,
    wants_anonymous: true,
  };

  beforeEach(() => {
    prisma = {
      donationPlan: { findUnique: jest.fn() },
      donor: { update: jest.fn().mockResolvedValue({}) },
      subscription: {
        create: jest.fn().mockResolvedValue({
          id: 'sub-1',
          asaasSubscriptionId: 'asaas_sub_1',
          status: 'PENDING',
          billingType: 'BOLETO',
          nextDueDate: new Date('2026-07-01'),
        }),
      },
    };

    asaas = {
      createSubscription: jest.fn().mockResolvedValue({
        id: 'asaas_sub_1',
        status: 'ACTIVE',
      }),
    };

    donors = {
      findOrCreate: jest.fn().mockResolvedValue({
        id: 'donor-1',
        asaasCustomerId: 'cus_1',
        cpfCnpj: null,
        phone: null,
        zipCode: null,
        address: null,
        addressNumber: null,
        addressComplement: null,
        neighborhood: null,
        city: null,
        state: null,
      }),
    };

    service = new SubscriptionService(
      prisma as unknown as PrismaService,
      asaas as unknown as AsaasService,
      donors as unknown as DonorsService,
    );
  });

  it('creates subscription with fixed plan and stores asaas_subscription_id', async () => {
    prisma.donationPlan.findUnique.mockResolvedValue(activePlan);

    const result = await service.create(baseDto);

    expect(asaas.createSubscription).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_1',
        value: 19.9,
        billingType: 'BOLETO',
        cycle: 'MONTHLY',
      }),
    );
    expect(prisma.subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          asaasSubscriptionId: 'asaas_sub_1',
          status: 'PENDING',
          donorId: 'donor-1',
          planId: 'plan-1',
        }),
      }),
    );
    expect(result.asaas_subscription_id).toBe('asaas_sub_1');
    expect(result.confirmed).toBe(false);
    expect(result.pending).toBe(true);
  });

  it('creates subscription with custom amount for personalizado plan', async () => {
    prisma.donationPlan.findUnique.mockResolvedValue(customPlan);

    await service.create({
      ...baseDto,
      plan_id: 'plan-custom',
      custom_amount: 55,
    });

    expect(asaas.createSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ value: 55 }),
    );
  });

  it('rejects custom amount below minimum', async () => {
    prisma.donationPlan.findUnique.mockResolvedValue(customPlan);

    await expect(
      service.create({
        ...baseDto,
        plan_id: 'plan-custom',
        custom_amount: 5,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('requires mandatory consents', async () => {
    prisma.donationPlan.findUnique.mockResolvedValue(activePlan);

    await expect(
      service.create({
        ...baseDto,
        accepts_terms: false,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('requires cpf for boleto subscription', async () => {
    prisma.donationPlan.findUnique.mockResolvedValue(activePlan);

    await expect(
      service.create({
        ...baseDto,
        cpf_cnpj: undefined,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('requires card data for credit card subscription', async () => {
    prisma.donationPlan.findUnique.mockResolvedValue(activePlan);

    await expect(
      service.create({
        ...baseDto,
        billing_type: SubscriptionBillingTypeDto.CREDIT_CARD,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('does not mark subscription as active even if Asaas returns ACTIVE', async () => {
    prisma.donationPlan.findUnique.mockResolvedValue(activePlan);

    const result = await service.create(baseDto);

    expect(result.status).toBe('PENDING');
    expect(result.confirmed).toBe(false);
  });

  it('maps Asaas failure to service unavailable', async () => {
    prisma.donationPlan.findUnique.mockResolvedValue(activePlan);
    asaas.createSubscription.mockRejectedValue(
      new AsaasApiError('Timeout ou falha de comunicação com Asaas', 503),
    );

    await expect(service.create(baseDto)).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('throws when plan not found', async () => {
    prisma.donationPlan.findUnique.mockResolvedValue(null);

    await expect(service.create(baseDto)).rejects.toThrow(NotFoundException);
  });

  it('updates donor preferences without storing card data', async () => {
    prisma.donationPlan.findUnique.mockResolvedValue(activePlan);

    await service.create({
      ...baseDto,
      billing_type: SubscriptionBillingTypeDto.CREDIT_CARD,
      wants_public_mural: true,
      wants_anonymous: false,
      credit_card: {
        holder_name: 'Maria Silva',
        number: '5162306219378829',
        expiry_month: '12',
        expiry_year: '2030',
        ccv: '123',
      },
      credit_card_holder: {
        name: 'Maria Silva',
        email: 'maria@test.com',
        cpf_cnpj: '24971563792',
        postal_code: '70000000',
        address_number: '100',
        phone: '61999999999',
      },
    });

    expect(prisma.donor.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          wantsPublicProfile: true,
          publicDisplayType: 'FULL_NAME',
        }),
      }),
    );

    const subscriptionData = prisma.subscription.create.mock.calls[0][0].data;
    expect(subscriptionData).not.toHaveProperty('creditCard');
  });
});
