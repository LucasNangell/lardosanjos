import { AsaasWebhookProcessor } from './asaas-webhook.processor';
import { PrismaService } from '../../prisma/prisma.service';
import { AsaasService } from './asaas.service';
import { DonorCardService } from '../../donor/donor-card.service';

describe('AsaasWebhookProcessor', () => {
  let processor: AsaasWebhookProcessor;
  let prisma: {
    asaasWebhookEvent: { findUnique: jest.Mock; update: jest.Mock };
    payment: { findUnique: jest.Mock; update: jest.Mock };
    subscription: { findUnique: jest.Mock; update: jest.Mock };
  };
  let asaas: { getPayment: jest.Mock; getSubscription: jest.Mock };
  let donorCard: { ensureActiveCard: jest.Mock };
  let badges: { evaluateDonor: jest.Mock; awardCampaignSupporter: jest.Mock };
  let campaignDonations: {
    linkPayment: jest.Mock;
    getCampaignIdForPayment: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      asaasWebhookEvent: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      payment: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      subscription: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    asaas = {
      getPayment: jest.fn(),
      getSubscription: jest.fn(),
    };

    donorCard = {
      ensureActiveCard: jest.fn().mockResolvedValue(undefined),
    };

    badges = {
      evaluateDonor: jest.fn(),
      awardCampaignSupporter: jest.fn(),
    };

    campaignDonations = {
      linkPayment: jest.fn(),
      getCampaignIdForPayment: jest.fn().mockResolvedValue(null),
    };

    processor = new AsaasWebhookProcessor(
      prisma as unknown as PrismaService,
      asaas as unknown as AsaasService,
      donorCard as unknown as DonorCardService,
      badges as never,
      campaignDonations as never,
    );
  });

  it('updates payment to confirmed on PAYMENT_CONFIRMED webhook', async () => {
    prisma.asaasWebhookEvent.findUnique.mockResolvedValue({
      id: 'record-1',
      processed: false,
      payload: {
        id: 'evt_1',
        event: 'PAYMENT_CONFIRMED',
        payment: { id: 'pay_1', status: 'CONFIRMED' },
      },
    });
    prisma.payment.findUnique.mockResolvedValue({
      id: 'payment-1',
      status: 'PENDING',
      paidAt: null,
      receivedAt: null,
      invoiceUrl: null,
      boletoUrl: null,
    });
    asaas.getPayment.mockResolvedValue({
      id: 'pay_1',
      status: 'CONFIRMED',
      paymentDate: '2026-06-21',
      invoiceUrl: 'https://invoice',
    });

    await processor.processEvent('record-1');

    expect(prisma.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'CONFIRMED' }),
      }),
    );
    expect(prisma.asaasWebhookEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ processed: true }),
      }),
    );
  });

  it('does not downgrade payment on out-of-order pending webhook', async () => {
    prisma.asaasWebhookEvent.findUnique.mockResolvedValue({
      id: 'record-2',
      processed: false,
      payload: {
        id: 'evt_2',
        event: 'PAYMENT_CREATED',
        payment: { id: 'pay_1', status: 'PENDING' },
      },
    });
    prisma.payment.findUnique.mockResolvedValue({
      id: 'payment-1',
      status: 'CONFIRMED',
      paidAt: new Date(),
      receivedAt: new Date(),
      invoiceUrl: null,
      boletoUrl: null,
    });
    asaas.getPayment.mockResolvedValue({
      id: 'pay_1',
      status: 'PENDING',
    });

    await processor.processEvent('record-2');

    expect(prisma.payment.update).not.toHaveBeenCalled();
  });

  it('updates subscription to canceled on SUBSCRIPTION_DELETED', async () => {
    prisma.asaasWebhookEvent.findUnique.mockResolvedValue({
      id: 'record-3',
      processed: false,
      payload: {
        id: 'evt_3',
        event: 'SUBSCRIPTION_DELETED',
        subscription: { id: 'sub_1', status: 'INACTIVE' },
      },
    });
    prisma.subscription.findUnique.mockResolvedValue({
      id: 'subscription-1',
      donorId: 'donor-1',
      status: 'ACTIVE',
      nextDueDate: new Date('2026-07-01'),
      startedAt: new Date(),
      canceledAt: null,
    });
    asaas.getSubscription.mockResolvedValue({
      id: 'sub_1',
      status: 'INACTIVE',
      nextDueDate: '2026-07-01',
    });

    await processor.processEvent('record-3');

    expect(prisma.subscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'CANCELED' }),
      }),
    );
  });

  it('ignores payment webhook when local payment not found (pix manual unaffected)', async () => {
    prisma.asaasWebhookEvent.findUnique.mockResolvedValue({
      id: 'record-4',
      processed: false,
      payload: {
        id: 'evt_4',
        event: 'PAYMENT_CONFIRMED',
        payment: { id: 'pay_unknown', status: 'CONFIRMED' },
      },
    });
    prisma.payment.findUnique.mockResolvedValue(null);
    asaas.getPayment.mockResolvedValue({
      id: 'pay_unknown',
      status: 'CONFIRMED',
    });

    await processor.processEvent('record-4');

    expect(prisma.payment.update).not.toHaveBeenCalled();
    expect(prisma.asaasWebhookEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ processed: true }),
      }),
    );
  });

  it('records error message when processing fails', async () => {
    prisma.asaasWebhookEvent.findUnique.mockResolvedValue({
      id: 'record-5',
      processed: false,
      payload: {
        id: 'evt_5',
        event: 'PAYMENT_CONFIRMED',
        payment: { id: 'pay_1' },
      },
    });
    prisma.payment.findUnique.mockResolvedValue({
      id: 'payment-1',
      status: 'PENDING',
      paidAt: null,
      receivedAt: null,
      invoiceUrl: null,
      boletoUrl: null,
    });
    asaas.getPayment.mockRejectedValue(new Error('Asaas indisponível'));

    await expect(processor.processEvent('record-5')).rejects.toThrow(
      'Asaas indisponível',
    );

    expect(prisma.asaasWebhookEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ errorMessage: 'Asaas indisponível' }),
      }),
    );
  });
});
