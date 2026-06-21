import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Worker, Job, ConnectionOptions } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { AsaasService } from './asaas.service';
import { AsaasWebhookPayload } from './asaas.types';
import { DonorCardService } from '../../donor/donor-card.service';
import { BadgesService } from '../../badges/badges.service';
import { CampaignDonationsService } from '../../campaigns/campaign-donations.service';
import {
  mapAsaasPaymentStatus,
  mapAsaasSubscriptionStatus,
  mapSubscriptionEventType,
  shouldAdvancePaymentStatus,
  shouldAdvanceSubscriptionStatus,
} from './asaas-webhook.status';

const QUEUE_NAME = 'asaas-webhooks';

const PAYMENT_EVENTS = new Set([
  'PAYMENT_CREATED',
  'PAYMENT_CONFIRMED',
  'PAYMENT_RECEIVED',
  'PAYMENT_OVERDUE',
  'PAYMENT_DELETED',
  'PAYMENT_REFUNDED',
  'PAYMENT_CHARGEBACK_REQUESTED',
  'PAYMENT_CHARGEBACK_DISPUTE',
  'PAYMENT_AWAITING_RISK_ANALYSIS',
  'PAYMENT_RESTORED',
  'PAYMENT_UPDATED',
]);

const SUBSCRIPTION_EVENTS = new Set([
  'SUBSCRIPTION_CREATED',
  'SUBSCRIPTION_UPDATED',
  'SUBSCRIPTION_DELETED',
  'SUBSCRIPTION_INACTIVATED',
]);

@Injectable()
export class AsaasWebhookProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AsaasWebhookProcessor.name);
  private worker: Worker | null = null;
  private connectionOptions: ConnectionOptions | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly asaasService: AsaasService,
    private readonly donorCardService: DonorCardService,
    private readonly badgesService: BadgesService,
    private readonly campaignDonationsService: CampaignDonationsService,
  ) {}

  onModuleInit() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      this.logger.warn('REDIS_URL não configurado — fila de webhooks desabilitada');
      return;
    }

    this.connectionOptions = {
      url: redisUrl,
      maxRetriesPerRequest: null,
    };

    this.worker = new Worker(
      QUEUE_NAME,
      async (job: Job<{ eventRecordId: string }>) => {
        await this.processEvent(job.data.eventRecordId);
      },
      { connection: this.connectionOptions },
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error(
        `Webhook job ${job?.id} failed: ${err.message}`,
        err.stack,
      );
    });

    this.logger.log('Asaas webhook processor iniciado');
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }

  getConnectionOptions(): ConnectionOptions | null {
    return this.connectionOptions;
  }

  async processEvent(eventRecordId: string): Promise<void> {
    const record = await this.prisma.asaasWebhookEvent.findUnique({
      where: { id: eventRecordId },
    });

    if (!record || record.processed) {
      return;
    }

    try {
      const payload = record.payload as unknown as AsaasWebhookPayload;
      await this.handlePayload(payload);

      await this.prisma.asaasWebhookEvent.update({
        where: { id: eventRecordId },
        data: { processed: true, processedAt: new Date(), errorMessage: null },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro desconhecido';
      await this.prisma.asaasWebhookEvent.update({
        where: { id: eventRecordId },
        data: { errorMessage: message },
      });
      throw error;
    }
  }

  private async handlePayload(payload: AsaasWebhookPayload): Promise<void> {
    const eventType = payload.event;

    if (payload.payment?.id && this.isPaymentEvent(eventType)) {
      await this.syncPayment(payload.payment.id, eventType, payload.payment.status);
    }

    if (payload.subscription?.id && this.isSubscriptionEvent(eventType)) {
      await this.syncSubscription(
        payload.subscription.id,
        eventType,
        payload.subscription.status,
      );
    }
  }

  private isPaymentEvent(eventType: string): boolean {
    return PAYMENT_EVENTS.has(eventType) || eventType.startsWith('PAYMENT_');
  }

  private isSubscriptionEvent(eventType: string): boolean {
    return SUBSCRIPTION_EVENTS.has(eventType) || eventType.startsWith('SUBSCRIPTION_');
  }

  private async syncPayment(
    asaasPaymentId: string,
    eventType: string,
    payloadStatus?: string,
  ): Promise<void> {
    const asaasPayment = await this.asaasService.getPayment(asaasPaymentId);
    const payment = await this.prisma.payment.findUnique({
      where: { asaasPaymentId },
    });

    if (!payment) {
      this.logger.warn(
        `Payment ${asaasPaymentId} não encontrado localmente (${eventType}) — ignorado (Pix manual não usa Asaas)`,
      );
      return;
    }

    const nextStatus = mapAsaasPaymentStatus(payloadStatus ?? asaasPayment.status);

    if (!shouldAdvancePaymentStatus(payment.status, nextStatus)) {
      this.logger.debug(
        `Payment ${payment.id} mantém status ${payment.status} (evento ${eventType} -> ${nextStatus})`,
      );
      return;
    }

    const paidAt = asaasPayment.paymentDate
      ? new Date(asaasPayment.paymentDate)
      : asaasPayment.clientPaymentDate
        ? new Date(asaasPayment.clientPaymentDate)
        : undefined;

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: nextStatus,
        paidAt: paidAt ?? payment.paidAt,
        receivedAt:
          nextStatus === 'RECEIVED' || nextStatus === 'CONFIRMED'
            ? paidAt ?? new Date()
            : payment.receivedAt,
        invoiceUrl: asaasPayment.invoiceUrl ?? payment.invoiceUrl,
        boletoUrl: asaasPayment.bankSlipUrl ?? payment.boletoUrl,
      },
    });

    if (nextStatus === 'RECEIVED' || nextStatus === 'CONFIRMED') {
      await this.badgesService.evaluateDonor(payment.donorId);
      const campaignId = await this.campaignDonationsService.getCampaignIdForPayment(
        payment.id,
      );
      if (campaignId) {
        await this.badgesService.awardCampaignSupporter(payment.donorId);
      }
    }
  }

  private async syncSubscription(
    asaasSubscriptionId: string,
    eventType: string,
    payloadStatus?: string,
  ): Promise<void> {
    const asaasSub = await this.asaasService.getSubscription(asaasSubscriptionId);
    const subscription = await this.prisma.subscription.findUnique({
      where: { asaasSubscriptionId },
    });

    if (!subscription) {
      this.logger.warn(
        `Subscription ${asaasSubscriptionId} não encontrada (${eventType})`,
      );
      return;
    }

    const eventMapped = mapSubscriptionEventType(eventType);
    const nextStatus =
      eventMapped ?? mapAsaasSubscriptionStatus(payloadStatus ?? asaasSub.status);

    if (!shouldAdvanceSubscriptionStatus(subscription.status, nextStatus)) {
      this.logger.debug(
        `Subscription ${subscription.id} mantém status ${subscription.status} (evento ${eventType} -> ${nextStatus})`,
      );
      return;
    }

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: nextStatus,
        nextDueDate: asaasSub.nextDueDate
          ? new Date(asaasSub.nextDueDate)
          : subscription.nextDueDate,
        startedAt:
          nextStatus === 'ACTIVE' && !subscription.startedAt
            ? new Date()
            : subscription.startedAt,
        canceledAt:
          nextStatus === 'INACTIVE' || nextStatus === 'CANCELED'
            ? subscription.canceledAt ?? new Date()
            : subscription.canceledAt,
      },
    });

    if (nextStatus === 'ACTIVE') {
      await this.donorCardService.ensureActiveCard(subscription.donorId);
    }
  }
}

export { QUEUE_NAME };
