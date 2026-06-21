import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { AsaasWebhookPayload } from './asaas.types';
import {
  AsaasWebhookProcessor,
  QUEUE_NAME,
} from './asaas-webhook.processor';
import { createHash } from 'crypto';

@Injectable()
export class AsaasWebhookService {
  private readonly logger = new Logger(AsaasWebhookService.name);
  private queue: Queue | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly processor: AsaasWebhookProcessor,
  ) {}

  private getQueue(): Queue | null {
    if (this.queue) return this.queue;

    const connection = this.processor.getConnectionOptions();
    if (!connection) return null;

    this.queue = new Queue(QUEUE_NAME, { connection });
    return this.queue;
  }

  async ingest(payload: AsaasWebhookPayload): Promise<{ received: boolean }> {
    const eventId = payload.id || this.buildStableEventId(payload);

    const existing = await this.prisma.asaasWebhookEvent.findUnique({
      where: { eventId },
    });

    if (existing) {
      this.logger.debug(`Webhook duplicado ignorado: ${eventId}`);
      return { received: true };
    }

    let record;
    try {
      record = await this.prisma.asaasWebhookEvent.create({
        data: {
          eventId,
          eventType: payload.event,
          payload: payload as object,
        },
      });
    } catch (error) {
      const prismaError = error as { code?: string };
      if (prismaError.code === 'P2002') {
        this.logger.debug(`Webhook duplicado (race): ${eventId}`);
        return { received: true };
      }
      throw error;
    }

    await this.enqueueProcessing(record.id);
    return { received: true };
  }

  async reprocess(eventRecordId: string): Promise<{ queued: boolean }> {
    const record = await this.prisma.asaasWebhookEvent.findUnique({
      where: { id: eventRecordId },
    });

    if (!record) {
      throw new NotFoundException('Evento de webhook não encontrado');
    }

    await this.prisma.asaasWebhookEvent.update({
      where: { id: eventRecordId },
      data: {
        processed: false,
        processedAt: null,
        errorMessage: null,
      },
    });

    await this.enqueueProcessing(eventRecordId);
    return { queued: true };
  }

  async list(params: {
    page?: number;
    limit?: number;
    processed?: boolean;
    event_type?: string;
  }) {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(100, Math.max(1, params.limit ?? 20));
    const skip = (page - 1) * limit;

    const where = {
      ...(params.processed !== undefined ? { processed: params.processed } : {}),
      ...(params.event_type ? { eventType: params.event_type } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.asaasWebhookEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.asaasWebhookEvent.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        event_id: item.eventId,
        event_type: item.eventType,
        processed: item.processed,
        processed_at: item.processedAt?.toISOString() ?? null,
        error_message: item.errorMessage,
        created_at: item.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
    };
  }

  async getById(id: string) {
    const record = await this.prisma.asaasWebhookEvent.findUnique({
      where: { id },
    });

    if (!record) {
      throw new NotFoundException('Evento de webhook não encontrado');
    }

    return {
      id: record.id,
      event_id: record.eventId,
      event_type: record.eventType,
      payload: record.payload,
      processed: record.processed,
      processed_at: record.processedAt?.toISOString() ?? null,
      error_message: record.errorMessage,
      created_at: record.createdAt.toISOString(),
    };
  }

  private async enqueueProcessing(eventRecordId: string): Promise<void> {
    const queue = this.getQueue();
    if (queue) {
      await queue.add(
        'process',
        { eventRecordId },
        {
          jobId: `asaas-webhook-${eventRecordId}`,
          removeOnComplete: true,
          removeOnFail: false,
        },
      );
      return;
    }

    try {
      await this.processor.processEvent(eventRecordId);
    } catch (error) {
      this.logger.error(
        `Falha ao processar webhook ${eventRecordId} inline`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private buildStableEventId(payload: AsaasWebhookPayload): string {
    const hash = createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex')
      .slice(0, 32);
    if (!payload.event) {
      throw new BadRequestException('Payload de webhook inválido');
    }
    return `${payload.event}:${hash}`;
  }
}
