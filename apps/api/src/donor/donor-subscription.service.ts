import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Donor } from '@lardosanjos/database';
import { PrismaService } from '../prisma/prisma.service';
import { AsaasService } from '../integrations/asaas/asaas.service';
import { AsaasApiError } from '../integrations/asaas/asaas.errors';
import { AuditService } from '../common/audit.service';
import { DonorService } from './donor.service';
import { DonorCardService } from './donor-card.service';
import {
  CancelDonorSubscriptionDto,
  PauseDonorSubscriptionDto,
  UpdateDonorPaymentMethodDto,
  UpdateDonorSubscriptionDto,
} from './dto/donor-subscription.dto';

@Injectable()
export class DonorSubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly asaasService: AsaasService,
    private readonly donorService: DonorService,
    private readonly donorCardService: DonorCardService,
    private readonly auditService: AuditService,
  ) {}

  async getSubscription(donor: Donor) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { donorId: donor.id, status: { in: ['ACTIVE', 'PENDING'] } },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      return {
        subscription: null,
        message: 'Nenhuma assinatura ativa ou pendente encontrada.',
      };
    }

    return {
      subscription: {
        id: subscription.id,
        status: subscription.status,
        billing_type: subscription.billingType,
        value: Number(subscription.value),
        next_due_date: subscription.nextDueDate?.toISOString().slice(0, 10) ?? null,
        started_at: subscription.startedAt?.toISOString() ?? null,
        plan: {
          id: subscription.plan.id,
          name: subscription.plan.name,
          slug: subscription.plan.slug,
          value: Number(subscription.plan.value),
          description: subscription.plan.description,
        },
        consequences: {
          future_charges:
            subscription.status === 'ACTIVE'
              ? 'Cobranças mensais continuarão até cancelamento.'
              : 'Assinatura pendente — cobrança após confirmação do gateway.',
          card_status:
            'Benefícios de assinante (ex.: carteirinha) dependem de assinatura ativa confirmada.',
        },
      },
    };
  }

  async updatePlan(
    donor: Donor,
    dto: UpdateDonorSubscriptionDto,
    userId: string,
    ipAddress?: string,
  ) {
    await this.assertPasswordConfirmed(donor.userId!, dto.password);

    const subscription = await this.donorService.getActiveSubscription(donor.id);
    const plan = await this.prisma.donationPlan.findUnique({
      where: { id: dto.plan_id },
    });

    if (!plan || !plan.isActive) {
      throw new NotFoundException('Plano não encontrado');
    }

    if (plan.id === subscription.planId) {
      throw new BadRequestException('Você já está neste plano');
    }

    if (!subscription.asaasSubscriptionId) {
      throw new BadRequestException('Assinatura sem vínculo Asaas');
    }

    let asaasSub;
    try {
      asaasSub = await this.asaasService.updateSubscription(
        subscription.asaasSubscriptionId,
        {
          value: Number(plan.value),
          description: `Assinatura ${plan.name} - Lar dos Anjos Pet`,
          updatePendingPayments: true,
        },
      );
    } catch (error) {
      throw this.mapAsaasError(error, 'Não foi possível alterar o plano no momento.');
    }

    const updated = await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        planId: plan.id,
        value: plan.value,
        status: this.mapSubscriptionStatus(asaasSub.status),
        nextDueDate: asaasSub.nextDueDate
          ? new Date(asaasSub.nextDueDate)
          : subscription.nextDueDate,
      },
      include: { plan: true },
    });

    await this.auditService.log({
      userId,
      action: 'DONOR_SUBSCRIPTION_CHANGE_PLAN',
      entity: 'subscriptions',
      entityId: subscription.id,
      oldData: { plan_id: subscription.planId, value: Number(subscription.value) },
      newData: { plan_id: plan.id, value: Number(plan.value) },
      ipAddress,
    });

    const isUpgrade = Number(plan.value) > Number(subscription.value);

    return {
      id: updated.id,
      status: updated.status,
      change_type: isUpgrade ? 'upgrade' : 'downgrade',
      plan: {
        id: updated.plan.id,
        name: updated.plan.name,
        value: Number(updated.plan.value),
      },
      message: isUpgrade
        ? 'Plano atualizado. O novo valor será aplicado nas próximas cobranças.'
        : 'Plano alterado. Reduções também passam a valer nas próximas cobranças.',
    };
  }

  async cancel(
    donor: Donor,
    dto: CancelDonorSubscriptionDto,
    userId: string,
    ipAddress?: string,
  ) {
    await this.assertPasswordConfirmed(donor.userId!, dto.password);

    const subscription = await this.donorService.getActiveSubscription(donor.id);

    if (!subscription.asaasSubscriptionId) {
      throw new BadRequestException('Assinatura sem vínculo Asaas');
    }

    let asaasSub;
    try {
      asaasSub = await this.asaasService.cancelSubscription(
        subscription.asaasSubscriptionId,
      );
    } catch (error) {
      throw this.mapAsaasError(
        error,
        'Não foi possível cancelar no Asaas. Sua assinatura permanece ativa — tente novamente.',
      );
    }

    const cancelReason = this.buildCancelReason(dto);

    const updated = await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELED',
        canceledAt: new Date(),
        cancelReason,
      },
    });

    await this.prisma.donorCard.updateMany({
      where: { donorId: donor.id, status: 'ACTIVE' },
      data: { status: 'INACTIVE' },
    });

    await this.auditService.log({
      userId,
      action: 'DONOR_SUBSCRIPTION_CANCEL',
      entity: 'subscriptions',
      entityId: subscription.id,
      oldData: { status: subscription.status },
      newData: {
        status: 'CANCELED',
        asaas_status: asaasSub.status,
        reason: cancelReason,
      },
      ipAddress,
    });

    return {
      id: updated.id,
      status: updated.status,
      canceled_at: updated.canceledAt?.toISOString(),
      message:
        'Assinatura cancelada. Não haverá novas cobranças. Você pode assinar novamente quando quiser.',
    };
  }

  async updatePaymentMethod(
    donor: Donor,
    dto: UpdateDonorPaymentMethodDto,
    userId: string,
    ipAddress?: string,
  ) {
    await this.assertPasswordConfirmed(donor.userId!, dto.password);

    const subscription = await this.donorService.getActiveSubscription(donor.id);

    if (subscription.billingType !== 'CREDIT_CARD') {
      throw new BadRequestException(
        'Alteração de cartão disponível apenas para assinaturas com cartão',
      );
    }

    if (!subscription.asaasSubscriptionId) {
      throw new BadRequestException('Assinatura sem vínculo Asaas');
    }

    try {
      await this.asaasService.updateSubscriptionCreditCard(
        subscription.asaasSubscriptionId,
        {
          creditCard: {
            holderName: dto.credit_card.holder_name,
            number: dto.credit_card.number,
            expiryMonth: dto.credit_card.expiry_month,
            expiryYear: dto.credit_card.expiry_year,
            ccv: dto.credit_card.ccv,
          },
          creditCardHolderInfo: {
            name: dto.credit_card_holder.name,
            email: dto.credit_card_holder.email,
            cpfCnpj: dto.credit_card_holder.cpf_cnpj,
            postalCode: dto.credit_card_holder.postal_code,
            addressNumber: dto.credit_card_holder.address_number,
            phone: dto.credit_card_holder.phone,
          },
        },
      );
    } catch (error) {
      throw this.mapAsaasError(
        error,
        'Não foi possível atualizar o cartão. Verifique os dados e tente novamente.',
      );
    }

    await this.auditService.log({
      userId,
      action: 'DONOR_SUBSCRIPTION_UPDATE_PAYMENT',
      entity: 'subscriptions',
      entityId: subscription.id,
      newData: { billing_type: 'CREDIT_CARD', card_updated: true },
      ipAddress,
    });

    return {
      message:
        'Cartão atualizado com sucesso. Os dados não são armazenados em nossos servidores.',
    };
  }

  async pause(
    donor: Donor,
    dto: PauseDonorSubscriptionDto,
    userId: string,
    ipAddress?: string,
  ) {
    await this.assertPasswordConfirmed(donor.userId!, dto.password);

    await this.donorService.getActiveSubscription(donor.id);

    await this.auditService.log({
      userId,
      action: 'DONOR_SUBSCRIPTION_PAUSE_REQUESTED',
      entity: 'subscriptions',
      entityId: donor.id,
      newData: { supported: false },
      ipAddress,
    });

    throw new BadRequestException(
      'Pausa temporária não está disponível via Asaas neste momento. Você pode cancelar sem burocracia e assinar novamente quando desejar.',
    );
  }

  async onSubscriptionActivated(donorId: string) {
    await this.donorCardService.ensureActiveCard(donorId);
  }

  private async assertPasswordConfirmed(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new BadRequestException('Senha de confirmação incorreta');
    }
  }

  private buildCancelReason(dto: CancelDonorSubscriptionDto): string {
    const parts: string[] = [];
    if (dto.reason_code) parts.push(`code:${dto.reason_code}`);
    if (dto.reason?.trim()) parts.push(dto.reason.trim());
    return parts.join(' | ') || 'Cancelado pelo doador';
  }

  private mapAsaasError(error: unknown, fallback: string): never {
    if (error instanceof AsaasApiError) {
      const status = error.getStatus();
      if (status === 503 || status === 502) {
        throw new ServiceUnavailableException(fallback);
      }
      throw new BadRequestException(fallback);
    }
    throw error;
  }

  private mapSubscriptionStatus(asaasStatus: string) {
    const map: Record<string, 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'CANCELED'> = {
      ACTIVE: 'ACTIVE',
      INACTIVE: 'INACTIVE',
      EXPIRED: 'INACTIVE',
    };
    return map[asaasStatus] ?? 'PENDING';
  }
}
