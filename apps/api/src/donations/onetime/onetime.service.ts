import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AsaasService } from '../../integrations/asaas/asaas.service';
import { AsaasApiError } from '../../integrations/asaas/asaas.errors';
import { DonorsService } from '../donors/donors.service';
import { CampaignDonationsService } from '../../campaigns/campaign-donations.service';
import { BadgesService } from '../../badges/badges.service';
import { OnetimeBillingType, OnetimeDonationDto } from './onetime.dto';
import { PaymentBillingType, PaymentStatus } from '@lardosanjos/database';

const MIN_ONETIME_AMOUNT = 1;

export type OnetimeOutcome = 'processing' | 'approved' | 'pending' | 'refused';

@Injectable()
export class OnetimeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly asaasService: AsaasService,
    private readonly donorsService: DonorsService,
    private readonly campaignDonationsService: CampaignDonationsService,
    private readonly badgesService: BadgesService,
  ) {}

  async create(dto: OnetimeDonationDto) {
    if (dto.amount < MIN_ONETIME_AMOUNT) {
      throw new BadRequestException(
        `Valor mínimo para doação: R$ ${MIN_ONETIME_AMOUNT.toFixed(2)}`,
      );
    }

    if (
      dto.billing_type === OnetimeBillingType.CREDIT_CARD &&
      (!dto.credit_card || !dto.credit_card_holder)
    ) {
      throw new BadRequestException(
        'Dados do cartão são obrigatórios para pagamento com cartão',
      );
    }

    if (
      dto.billing_type === OnetimeBillingType.BOLETO &&
      !dto.cpf_cnpj?.trim()
    ) {
      throw new BadRequestException('CPF/CNPJ é obrigatório para boleto');
    }

    const donor = await this.donorsService.findOrCreate({
      fullName: dto.donor_name,
      email: dto.donor_email,
      cpfCnpj: dto.cpf_cnpj,
      phone: dto.donor_phone,
      postalCode: dto.credit_card_holder?.postal_code,
      addressNumber: dto.credit_card_holder?.address_number,
    });

    const dueDate = this.formatDate(
      new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    );

    const paymentInput = {
      customer: donor.asaasCustomerId!,
      billingType: dto.billing_type as 'CREDIT_CARD' | 'BOLETO',
      value: dto.amount,
      dueDate,
      description: 'Doação avulsa - Lar dos Anjos Pet',
      externalReference: donor.id,
      ...(dto.billing_type === OnetimeBillingType.CREDIT_CARD && {
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

    let asaasPayment;
    try {
      asaasPayment =
        dto.billing_type === OnetimeBillingType.CREDIT_CARD
          ? await this.asaasService.createCreditCardPayment(paymentInput)
          : await this.asaasService.createBoletoPayment(paymentInput);
    } catch (error) {
      throw this.mapAsaasError(error);
    }

    let boletoDigitableLine: string | undefined;
    if (dto.billing_type === OnetimeBillingType.BOLETO) {
      try {
        const identification =
          await this.asaasService.getPaymentIdentificationField(asaasPayment.id);
        boletoDigitableLine = identification.identificationField;
      } catch {
        /* linha digitável opcional se Asaas ainda não gerou */
      }
    }

    const mappedStatus = this.mapStatus(asaasPayment.status);
    const confirmed =
      mappedStatus === 'CONFIRMED' || mappedStatus === 'RECEIVED';

    const payment = await this.prisma.payment.create({
      data: {
        donorId: donor.id,
        asaasPaymentId: asaasPayment.id,
        type: 'ONETIME',
        billingType: dto.billing_type as PaymentBillingType,
        value: dto.amount,
        status: mappedStatus,
        dueDate: new Date(dueDate),
        invoiceUrl: asaasPayment.invoiceUrl,
        boletoUrl: asaasPayment.bankSlipUrl,
      },
    });

    if (dto.campaign_id) {
      await this.campaignDonationsService.linkPayment(dto.campaign_id, payment.id);
    }

    if (confirmed) {
      await this.badgesService.evaluateDonor(donor.id);
      if (dto.campaign_id) {
        await this.badgesService.awardCampaignSupporter(donor.id);
      }
    }

    const outcome = this.mapOutcome(mappedStatus);

    return {
      id: payment.id,
      asaas_payment_id: payment.asaasPaymentId,
      status: payment.status,
      billing_type: payment.billingType,
      value: Number(payment.value),
      due_date: payment.dueDate.toISOString().slice(0, 10),
      invoice_url: payment.invoiceUrl,
      boleto_url: payment.boletoUrl,
      boleto_digitable_line: boletoDigitableLine,
      outcome,
      pending: !confirmed && outcome !== 'refused',
      confirmed,
      message: this.buildUserMessage(outcome, dto.billing_type),
    };
  }

  private mapAsaasError(error: unknown): never {
    if (error instanceof AsaasApiError) {
      const status = error.getStatus();
      const message = this.publicAsaasMessage(error);

      if (status === 503 || status === 502) {
        throw new ServiceUnavailableException(message);
      }

      throw new BadRequestException(message);
    }

    throw error;
  }

  private publicAsaasMessage(error: AsaasApiError): string {
    const status = error.getStatus();
    if (status === 503 || status === 502) {
      return 'Serviço de pagamento temporariamente indisponível. Tente novamente em instantes.';
    }
    return 'Não foi possível processar o pagamento. Verifique os dados informados ou tente outro método.';
  }

  private buildUserMessage(
    outcome: OnetimeOutcome,
    billingType: OnetimeBillingType,
  ): string {
    switch (outcome) {
      case 'approved':
        return billingType === OnetimeBillingType.CREDIT_CARD
          ? 'Pagamento autorizado. A confirmação final será registrada pelo sistema assim que o gateway concluir a análise.'
          : 'Boleto gerado com sucesso. Após o pagamento, a confirmação pode levar alguns dias úteis.';
      case 'refused':
        return 'Pagamento recusado. Verifique os dados do cartão ou escolha outra forma de pagamento.';
      case 'pending':
        return billingType === OnetimeBillingType.BOLETO
          ? 'Boleto gerado. Pague até a data de vencimento para concluir sua doação.'
          : 'Pagamento em análise. Você receberá a confirmação quando o processamento for concluído.';
      default:
        return 'Solicitação recebida. Aguarde o processamento.';
    }
  }

  private mapOutcome(status: PaymentStatus): OnetimeOutcome {
    if (status === 'CONFIRMED' || status === 'RECEIVED') {
      return 'approved';
    }
    if (status === 'FAILED' || status === 'CANCELED' || status === 'REFUNDED') {
      return 'refused';
    }
    return 'pending';
  }

  private mapStatus(asaasStatus: string): PaymentStatus {
    const map: Record<string, PaymentStatus> = {
      PENDING: 'PENDING',
      RECEIVED: 'RECEIVED',
      CONFIRMED: 'CONFIRMED',
      OVERDUE: 'OVERDUE',
      REFUNDED: 'REFUNDED',
      FAILED: 'FAILED',
      CANCELED: 'CANCELED',
      AWAITING_RISK_ANALYSIS: 'PENDING',
    };
    return map[asaasStatus] ?? 'PENDING';
  }

  private formatDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
