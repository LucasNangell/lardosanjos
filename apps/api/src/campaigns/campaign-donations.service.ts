import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CampaignStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CampaignDonationsService {
  constructor(private readonly prisma: PrismaService) {}

  async assertLinkableCampaign(campaignId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        id: campaignId,
        status: { in: [CampaignStatus.ACTIVE, CampaignStatus.COMPLETED] },
      },
    });
    if (!campaign) {
      throw new BadRequestException('Campanha inválida ou indisponível');
    }
    return campaign;
  }

  async linkPixDonation(campaignId: string, pixDonationId: string) {
    await this.assertLinkableCampaign(campaignId);

    const existing = await this.prisma.campaignDonation.findFirst({
      where: { pixDonationId },
    });
    if (existing) return existing;

    return this.prisma.campaignDonation.create({
      data: { campaignId, pixDonationId },
    });
  }

  async linkPayment(campaignId: string, paymentId: string) {
    await this.assertLinkableCampaign(campaignId);

    const existing = await this.prisma.campaignDonation.findFirst({
      where: { paymentId },
    });
    if (existing) return existing;

    return this.prisma.campaignDonation.create({
      data: { campaignId, paymentId },
    });
  }

  async getCampaignIdForPix(pixDonationId: string) {
    const link = await this.prisma.campaignDonation.findFirst({
      where: { pixDonationId },
    });
    return link?.campaignId ?? null;
  }

  async getCampaignIdForPayment(paymentId: string) {
    const link = await this.prisma.campaignDonation.findFirst({
      where: { paymentId },
    });
    return link?.campaignId ?? null;
  }

  async manualLink(
    campaignId: string,
    params: { paymentId?: string; pixDonationId?: string },
  ) {
    if (!params.paymentId && !params.pixDonationId) {
      throw new BadRequestException('Informe paymentId ou pixDonationId');
    }
    await this.assertLinkableCampaign(campaignId);

    if (params.pixDonationId) {
      const pix = await this.prisma.pixDonation.findUnique({
        where: { id: params.pixDonationId },
      });
      if (!pix) throw new NotFoundException('Doação Pix não encontrada');
      return this.linkPixDonation(campaignId, params.pixDonationId);
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: params.paymentId! },
    });
    if (!payment) throw new NotFoundException('Pagamento não encontrado');
    return this.linkPayment(campaignId, params.paymentId!);
  }
}
