import {
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { OnetimeService } from './onetime.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AsaasService } from '../../integrations/asaas/asaas.service';
import { DonorsService } from '../donors/donors.service';
import { AsaasApiError } from '../../integrations/asaas/asaas.errors';
import { OnetimeBillingType } from './onetime.dto';

describe('OnetimeService', () => {
  let service: OnetimeService;
  let prisma: { payment: { create: jest.Mock } };
  let asaas: {
    createCreditCardPayment: jest.Mock;
    createBoletoPayment: jest.Mock;
    getPaymentIdentificationField: jest.Mock;
  };
  let donors: { findOrCreate: jest.Mock };
  let campaignDonations: { linkPayment: jest.Mock };
  let badges: { evaluateDonor: jest.Mock };

  const baseDto = {
    donor_name: 'Maria Silva',
    donor_email: 'maria@test.com',
    donor_phone: '61999999999',
    cpf_cnpj: '24971563792',
    amount: 50,
  };

  beforeEach(() => {
    prisma = {
      payment: {
        create: jest.fn().mockResolvedValue({
          id: 'payment-1',
          asaasPaymentId: 'pay_asaas_1',
          status: 'PENDING',
          billingType: 'BOLETO',
          value: 50,
          dueDate: new Date('2026-07-01'),
          invoiceUrl: 'https://invoice',
          boletoUrl: 'https://boleto',
        }),
      },
    };

    asaas = {
      createCreditCardPayment: jest.fn(),
      createBoletoPayment: jest.fn(),
      getPaymentIdentificationField: jest.fn(),
    };

    donors = {
      findOrCreate: jest.fn().mockResolvedValue({
        id: 'donor-1',
        asaasCustomerId: 'cus_1',
      }),
    };

    campaignDonations = { linkPayment: jest.fn() };
    badges = { evaluateDonor: jest.fn() };

    service = new OnetimeService(
      prisma as unknown as PrismaService,
      asaas as unknown as AsaasService,
      donors as unknown as DonorsService,
      campaignDonations as never,
      badges as never,
    );
  });

  it('creates boleto payment and persists in payments table', async () => {
    asaas.createBoletoPayment.mockResolvedValue({
      id: 'pay_asaas_1',
      status: 'PENDING',
      invoiceUrl: 'https://invoice',
      bankSlipUrl: 'https://boleto',
    });
    asaas.getPaymentIdentificationField.mockResolvedValue({
      identificationField: '23790.00000 00000.000000 00000.000000 0 00000000000000',
    });

    const result = await service.create({
      ...baseDto,
      billing_type: OnetimeBillingType.BOLETO,
    });

    expect(donors.findOrCreate).toHaveBeenCalled();
    expect(asaas.createBoletoPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_1',
        billingType: 'BOLETO',
        value: 50,
      }),
    );
    expect(prisma.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: 'ONETIME',
          billingType: 'BOLETO',
          asaasPaymentId: 'pay_asaas_1',
          status: 'PENDING',
        }),
      }),
    );
    expect(result.outcome).toBe('pending');
    expect(result.confirmed).toBe(false);
    expect(result.boleto_digitable_line).toContain('23790');
    expect(result).not.toHaveProperty('credit_card');
  });

  it('creates approved credit card payment without persisting card data', async () => {
    asaas.createCreditCardPayment.mockResolvedValue({
      id: 'pay_cc_1',
      status: 'CONFIRMED',
      invoiceUrl: 'https://invoice',
    });
    prisma.payment.create.mockResolvedValue({
      id: 'payment-cc',
      asaasPaymentId: 'pay_cc_1',
      status: 'CONFIRMED',
      billingType: 'CREDIT_CARD',
      value: 50,
      dueDate: new Date('2026-07-01'),
      invoiceUrl: 'https://invoice',
      boletoUrl: null,
    });

    const result = await service.create({
      ...baseDto,
      billing_type: OnetimeBillingType.CREDIT_CARD,
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

    expect(asaas.createCreditCardPayment).toHaveBeenCalled();
    const prismaData = prisma.payment.create.mock.calls[0][0].data;
    expect(prismaData).not.toHaveProperty('creditCard');
    expect(prismaData).not.toHaveProperty('number');
    expect(result.outcome).toBe('approved');
    expect(result.confirmed).toBe(true);
  });

  it('maps refused card status without leaking gateway details', async () => {
    asaas.createCreditCardPayment.mockResolvedValue({
      id: 'pay_refused',
      status: 'FAILED',
    });
    prisma.payment.create.mockResolvedValue({
      id: 'payment-refused',
      asaasPaymentId: 'pay_refused',
      status: 'FAILED',
      billingType: 'CREDIT_CARD',
      value: 50,
      dueDate: new Date('2026-07-01'),
      invoiceUrl: null,
      boletoUrl: null,
    });

    const result = await service.create({
      ...baseDto,
      billing_type: OnetimeBillingType.CREDIT_CARD,
      credit_card: {
        holder_name: 'Maria Silva',
        number: '4000000000000002',
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

    expect(result.outcome).toBe('refused');
    expect(result.confirmed).toBe(false);
    expect(result.message).not.toMatch(/cvv|cartão completo/i);
  });

  it('rejects amount below minimum', async () => {
    await expect(
      service.create({
        ...baseDto,
        amount: 0.5,
        billing_type: OnetimeBillingType.BOLETO,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(asaas.createBoletoPayment).not.toHaveBeenCalled();
  });

  it('requires card fields for credit card billing', async () => {
    await expect(
      service.create({
        ...baseDto,
        billing_type: OnetimeBillingType.CREDIT_CARD,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('requires cpf for boleto', async () => {
    await expect(
      service.create({
        donor_name: 'Maria',
        donor_email: 'maria@test.com',
        amount: 50,
        billing_type: OnetimeBillingType.BOLETO,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('maps Asaas network failure to service unavailable', async () => {
    asaas.createBoletoPayment.mockRejectedValue(
      new AsaasApiError('Timeout ou falha de comunicação com Asaas', 503),
    );

    await expect(
      service.create({
        ...baseDto,
        billing_type: OnetimeBillingType.BOLETO,
      }),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it('does not use pix_donations — only payments table', async () => {
    asaas.createBoletoPayment.mockResolvedValue({
      id: 'pay_asaas_1',
      status: 'PENDING',
    });

    await service.create({
      ...baseDto,
      billing_type: OnetimeBillingType.BOLETO,
    });

    expect(prisma.payment.create).toHaveBeenCalledTimes(1);
    expect(prisma).not.toHaveProperty('pixDonation');
  });
});
