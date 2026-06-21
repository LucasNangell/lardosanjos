import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AsaasService } from '../../integrations/asaas/asaas.service';
import { AsaasApiError } from '../../integrations/asaas/asaas.errors';
import { DonorsService } from '../donors/donors.service';
import {
  CUSTOM_SUBSCRIPTION_PLAN_SLUG,
  MIN_CUSTOM_SUBSCRIPTION_AMOUNT,
  SubscriptionBillingTypeDto,
  SubscriptionDonationDto,
} from './subscription.dto';
import { SubscriptionBillingType } from '@lardosanjos/database';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly asaasService: AsaasService,
    private readonly donorsService: DonorsService,
  ) {}

  async create(dto: SubscriptionDonationDto) {
    if (!dto.accepts_terms || !dto.accepts_privacy) {
      throw new BadRequestException(
        'É necessário aceitar os termos e a política de privacidade',
      );
    }

    const plan = await this.prisma.donationPlan.findUnique({
      where: { id: dto.plan_id },
    });

    if (!plan || !plan.isActive) {
      throw new NotFoundException('Plano de doação não encontrado');
    }

    const subscriptionValue = this.resolvePlanValue(plan.slug, Number(plan.value), dto);

    if (
      dto.billing_type === SubscriptionBillingTypeDto.CREDIT_CARD &&
      (!dto.credit_card || !dto.credit_card_holder)
    ) {
      throw new BadRequestException(
        'Dados do cartão são obrigatórios para assinatura com cartão',
      );
    }

    if (
      dto.billing_type === SubscriptionBillingTypeDto.BOLETO &&
      !dto.cpf_cnpj?.trim()
    ) {
      throw new BadRequestException('CPF/CNPJ é obrigatório para assinatura via boleto');
    }

    const donor = await this.donorsService.findOrCreate({
      fullName: dto.donor_name,
      email: dto.donor_email,
      cpfCnpj: dto.cpf_cnpj,
      phone: dto.donor_phone,
      postalCode: dto.postal_code ?? dto.credit_card_holder?.postal_code,
      address: dto.address,
      addressNumber: dto.address_number ?? dto.credit_card_holder?.address_number,
      addressComplement: dto.address_complement,
      neighborhood: dto.neighborhood,
      city: dto.city,
      state: dto.state,
    });

    await this.prisma.donor.update({
      where: { id: donor.id },
      data: {
        cpfCnpj: dto.cpf_cnpj ?? donor.cpfCnpj,
        phone: dto.donor_phone ?? donor.phone,
        zipCode: dto.postal_code ?? dto.credit_card_holder?.postal_code ?? donor.zipCode,
        address: dto.address ?? donor.address,
        addressNumber:
          dto.address_number ?? dto.credit_card_holder?.address_number ?? donor.addressNumber,
        addressComplement: dto.address_complement ?? donor.addressComplement,
        neighborhood: dto.neighborhood ?? donor.neighborhood,
        city: dto.city ?? donor.city,
        state: dto.state ?? donor.state,
        wantsPublicProfile: Boolean(dto.wants_public_mural),
        publicDisplayType: dto.wants_anonymous ? 'ANONYMOUS' : 'FULL_NAME',
        communicationEmail: dto.communication_email ?? true,
        communicationWhatsapp: dto.communication_whatsapp ?? false,
      },
    });

    const nextDueDate = this.formatDate(
      new Date(Date.now() + 24 * 60 * 60 * 1000),
    );

    const asaasInput = {
      customer: donor.asaasCustomerId!,
      billingType: dto.billing_type as 'CREDIT_CARD' | 'BOLETO',
      value: subscriptionValue,
      nextDueDate,
      cycle: 'MONTHLY' as const,
      description: `Assinatura ${plan.name} - Lar dos Anjos Pet`,
      externalReference: `${donor.id}:${plan.id}`,
      ...(dto.billing_type === SubscriptionBillingTypeDto.CREDIT_CARD && {
        creditCard: {
          holderName: dto.credit_card!.holder_name,
          number: dto.credit_card!.number,
          expiryMonth: dto.credit_card!.expiry_month,
          expiryYear: dto.credit_card!.expiry_year,
          ccv: dto.credit_card!.ccv,
        },
        creditCardHolderInfo: {
          name: dto.credit_card_holder!.name,
          email: dto.credit_card_holder!.email,
          cpfCnpj: dto.credit_card_holder!.cpf_cnpj,
          postalCode: dto.credit_card_holder!.postal_code,
          addressNumber: dto.credit_card_holder!.address_number,
          phone: dto.credit_card_holder!.phone,
        },
      }),
    };

    let asaasSubscription;
    try {
      asaasSubscription = await this.asaasService.createSubscription(asaasInput);
    } catch (error) {
      throw this.mapAsaasError(error);
    }

    const subscription = await this.prisma.subscription.create({
      data: {
        donorId: donor.id,
        planId: plan.id,
        asaasSubscriptionId: asaasSubscription.id,
        billingType: dto.billing_type as SubscriptionBillingType,
        value: subscriptionValue,
        cycle: 'MONTHLY',
        status: 'PENDING',
        nextDueDate: new Date(nextDueDate),
      },
    });

    return {
      id: subscription.id,
      asaas_subscription_id: subscription.asaasSubscriptionId,
      plan: {
        id: plan.id,
        name: plan.name,
        slug: plan.slug,
        value: subscriptionValue,
      },
      status: subscription.status,
      billing_type: subscription.billingType,
      next_due_date: subscription.nextDueDate?.toISOString().slice(0, 10),
      pending: true,
      confirmed: false,
      message:
        'Assinatura registrada com sucesso. A ativação plena será confirmada após validação do primeiro pagamento.',
    };
  }

  private resolvePlanValue(
    planSlug: string,
    planValue: number,
    dto: SubscriptionDonationDto,
  ): number {
    if (planSlug !== CUSTOM_SUBSCRIPTION_PLAN_SLUG) {
      return planValue;
    }

    if (!dto.custom_amount || dto.custom_amount < MIN_CUSTOM_SUBSCRIPTION_AMOUNT) {
      throw new BadRequestException(
        `Valor personalizado mínimo: R$ ${MIN_CUSTOM_SUBSCRIPTION_AMOUNT.toFixed(2)}`,
      );
    }

    return dto.custom_amount;
  }

  private mapAsaasError(error: unknown): never {
    if (error instanceof AsaasApiError) {
      const status = error.getStatus();
      const message =
        status === 503 || status === 502
          ? 'Serviço de pagamento temporariamente indisponível. Tente novamente em instantes.'
          : 'Não foi possível criar a assinatura. Verifique os dados ou tente novamente.';

      if (status === 503 || status === 502) {
        throw new ServiceUnavailableException(message);
      }

      throw new BadRequestException(message);
    }

    throw error;
  }

  private formatDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
