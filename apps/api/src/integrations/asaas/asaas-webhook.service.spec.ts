import { NotFoundException } from '@nestjs/common';
import { AsaasWebhookService } from './asaas-webhook.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AsaasWebhookProcessor } from './asaas-webhook.processor';
import { AsaasWebhookPayload } from './asaas.types';

describe('AsaasWebhookService', () => {
  let service: AsaasWebhookService;
  let prisma: {
    asaasWebhookEvent: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
    };
  };
  let processor: { processEvent: jest.Mock; getConnectionOptions: jest.Mock };

  const payload: AsaasWebhookPayload = {
    id: 'evt_123',
    event: 'PAYMENT_CONFIRMED',
    payment: {
      id: 'pay_1',
      customer: 'cus_1',
      billingType: 'CREDIT_CARD',
      value: 50,
      status: 'CONFIRMED',
      dueDate: '2026-07-01',
    },
  };

  beforeEach(() => {
    prisma = {
      asaasWebhookEvent: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };

    processor = {
      processEvent: jest.fn().mockResolvedValue(undefined),
      getConnectionOptions: jest.fn().mockReturnValue(null),
    };

    service = new AsaasWebhookService(
      prisma as unknown as PrismaService,
      processor as unknown as AsaasWebhookProcessor,
    );
  });

  it('saves valid webhook and processes inline without redis', async () => {
    prisma.asaasWebhookEvent.findUnique.mockResolvedValue(null);
    prisma.asaasWebhookEvent.create.mockResolvedValue({
      id: 'record-1',
      eventId: 'evt_123',
    });

    const result = await service.ingest(payload);

    expect(result).toEqual({ received: true });
    expect(prisma.asaasWebhookEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventId: 'evt_123',
          eventType: 'PAYMENT_CONFIRMED',
        }),
      }),
    );
    expect(processor.processEvent).toHaveBeenCalledWith('record-1');
  });

  it('ignores duplicate webhook by event_id', async () => {
    prisma.asaasWebhookEvent.findUnique.mockResolvedValue({
      id: 'record-1',
      eventId: 'evt_123',
    });

    const result = await service.ingest(payload);

    expect(result).toEqual({ received: true });
    expect(prisma.asaasWebhookEvent.create).not.toHaveBeenCalled();
    expect(processor.processEvent).not.toHaveBeenCalled();
  });

  it('reprocess resets event and enqueues processing', async () => {
    prisma.asaasWebhookEvent.findUnique.mockResolvedValue({
      id: 'record-1',
      eventId: 'evt_123',
    });
    prisma.asaasWebhookEvent.update.mockResolvedValue({});

    const result = await service.reprocess('record-1');

    expect(result).toEqual({ queued: true });
    expect(prisma.asaasWebhookEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'record-1' },
        data: expect.objectContaining({
          processed: false,
          errorMessage: null,
        }),
      }),
    );
    expect(processor.processEvent).toHaveBeenCalledWith('record-1');
  });

  it('throws when reprocessing unknown event', async () => {
    prisma.asaasWebhookEvent.findUnique.mockResolvedValue(null);

    await expect(service.reprocess('missing')).rejects.toThrow(NotFoundException);
  });
});
