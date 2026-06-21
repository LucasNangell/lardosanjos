import { Injectable, NotFoundException } from '@nestjs/common';
import { Donor } from '@lardosanjos/database';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit.service';
import { UpdateDonorProfileDto } from './dto/donor-profile.dto';
import { UpdateDonorPrivacyDto } from './dto/donor-privacy.dto';
import { maskCpfCnpj } from './donor.utils';
import {
  CONFIRMED_PAYMENT_STATUSES,
  CONFIRMED_PIX_STATUS,
} from '../common/constants/finance.constants';

@Injectable()
export class DonorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  getProfile(donor: Donor) {
    return {
      id: donor.id,
      full_name: donor.fullName,
      public_name: donor.publicName,
      email: donor.email,
      phone: donor.phone,
      cpf_cnpj: maskCpfCnpj(donor.cpfCnpj),
      birth_date: donor.birthDate?.toISOString().slice(0, 10) ?? null,
      zip_code: donor.zipCode,
      address: donor.address,
      address_number: donor.addressNumber,
      address_complement: donor.addressComplement,
      neighborhood: donor.neighborhood,
      city: donor.city,
      state: donor.state,
      wants_public_profile: donor.wantsPublicProfile,
      public_display_type: donor.publicDisplayType,
      communication_email: donor.communicationEmail,
      communication_whatsapp: donor.communicationWhatsapp,
    };
  }

  async updateProfile(
    donor: Donor,
    dto: UpdateDonorProfileDto,
    userId?: string,
    ipAddress?: string,
  ) {
    const updated = await this.prisma.donor.update({
      where: { id: donor.id },
      data: {
        fullName: dto.full_name,
        publicName: dto.public_name,
        email: dto.email?.toLowerCase(),
        phone: dto.phone,
        cpfCnpj: dto.cpf_cnpj,
        birthDate: dto.birth_date ? new Date(dto.birth_date) : undefined,
        zipCode: dto.zip_code,
        address: dto.address,
        addressNumber: dto.address_number,
        addressComplement: dto.address_complement,
        neighborhood: dto.neighborhood,
        city: dto.city,
        state: dto.state,
        wantsPublicProfile: dto.wants_public_profile,
        publicDisplayType: dto.public_display_type,
        communicationEmail: dto.communication_email,
        communicationWhatsapp: dto.communication_whatsapp,
      },
    });

    if (donor.userId && (dto.full_name || dto.email)) {
      await this.prisma.user.update({
        where: { id: donor.userId },
        data: {
          name: dto.full_name ?? undefined,
          email: dto.email?.toLowerCase() ?? undefined,
        },
      });
    }

    if (userId) {
      await this.auditService.log({
        userId,
        action: 'DONOR_PROFILE_UPDATE',
        entity: 'donors',
        entityId: donor.id,
        oldData: this.sanitizeForAudit(this.getProfile(donor)),
        newData: this.sanitizeForAudit(this.getProfile(updated)),
        ipAddress,
      });
    }

    return this.getProfile(updated);
  }

  async updatePrivacyPreferences(
    donor: Donor,
    dto: UpdateDonorPrivacyDto,
    userId?: string,
    ipAddress?: string,
  ) {
    const updated = await this.prisma.donor.update({
      where: { id: donor.id },
      data: {
        wantsPublicProfile: dto.wants_public_profile,
        publicDisplayType: dto.public_display_type,
        communicationEmail: dto.communication_email,
        communicationWhatsapp: dto.communication_whatsapp,
      },
    });

    if (userId) {
      await this.auditService.log({
        userId,
        action: 'DONOR_PRIVACY_UPDATE',
        entity: 'donors',
        entityId: donor.id,
        oldData: {
          wants_public_profile: donor.wantsPublicProfile,
          public_display_type: donor.publicDisplayType,
          communication_email: donor.communicationEmail,
          communication_whatsapp: donor.communicationWhatsapp,
        },
        newData: {
          wants_public_profile: updated.wantsPublicProfile,
          public_display_type: updated.publicDisplayType,
          communication_email: updated.communicationEmail,
          communication_whatsapp: updated.communicationWhatsapp,
        },
        ipAddress,
      });
    }

    return {
      wants_public_profile: updated.wantsPublicProfile,
      public_display_type: updated.publicDisplayType,
      communication_email: updated.communicationEmail,
      communication_whatsapp: updated.communicationWhatsapp,
      message:
        'Preferências salvas. Solicitações de exclusão total de dados podem ser feitas pelo contato do abrigo.',
    };
  }

  async listDonations(donor: Donor) {
    const [payments, pixDonations] = await Promise.all([
      this.prisma.payment.findMany({
        where: {
          donorId: donor.id,
          status: { in: CONFIRMED_PAYMENT_STATUSES },
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          billingType: true,
          value: true,
          status: true,
          paidAt: true,
          receivedAt: true,
          createdAt: true,
        },
      }),
      this.prisma.pixDonation.findMany({
        where: {
          donorId: donor.id,
          status: CONFIRMED_PIX_STATUS,
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          amount: true,
          status: true,
          manuallyConfirmedAt: true,
          createdAt: true,
        },
      }),
    ]);

    const items = [
      ...payments.map((p) => ({
        id: p.id,
        source: 'asaas' as const,
        type: p.type,
        billing_type: p.billingType,
        value: Number(p.value),
        status: p.status,
        paid_at: p.paidAt?.toISOString() ?? p.receivedAt?.toISOString() ?? null,
        created_at: p.createdAt.toISOString(),
      })),
      ...pixDonations.map((p) => ({
        id: p.id,
        source: 'pix' as const,
        type: 'ONETIME' as const,
        billing_type: 'PIX' as const,
        value: Number(p.amount),
        status: p.status,
        paid_at: p.manuallyConfirmedAt?.toISOString() ?? null,
        created_at: p.createdAt.toISOString(),
      })),
    ].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    return { items, total: items.length };
  }

  async getImpact(donor: Donor) {
    const [payments, pixDonations, subscription, badges] = await Promise.all([
      this.prisma.payment.findMany({
        where: {
          donorId: donor.id,
          status: { in: CONFIRMED_PAYMENT_STATUSES },
        },
        select: { value: true, type: true, createdAt: true },
      }),
      this.prisma.pixDonation.findMany({
        where: {
          donorId: donor.id,
          status: CONFIRMED_PIX_STATUS,
        },
        select: { amount: true },
      }),
      this.prisma.subscription.findFirst({
        where: { donorId: donor.id, status: 'ACTIVE' },
        include: { plan: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.donorBadge.findMany({
        where: { donorId: donor.id },
        include: { badge: true },
        orderBy: { awardedAt: 'desc' },
      }),
    ]);

    const totalConfirmed =
      payments.reduce((sum, p) => sum + Number(p.value), 0) +
      pixDonations.reduce((sum, p) => sum + Number(p.amount), 0);

    const recurringMonths = new Set(
      payments
        .filter((p) => p.type === 'RECURRING')
        .map((p) => p.createdAt.toISOString().slice(0, 7)),
    ).size;

    let supportMonths = recurringMonths;
    if (subscription?.startedAt) {
      const months = this.monthsBetween(subscription.startedAt, new Date());
      supportMonths = Math.max(supportMonths, months);
    }

    return {
      total_confirmed: totalConfirmed,
      support_months: supportMonths,
      current_plan: subscription
        ? {
            id: subscription.plan.id,
            name: subscription.plan.name,
            slug: subscription.plan.slug,
            value: Number(subscription.value),
          }
        : null,
      next_billing_date: subscription?.nextDueDate?.toISOString().slice(0, 10) ?? null,
      badges: badges.map((entry) => ({
        id: entry.badge.id,
        name: entry.badge.name,
        description: entry.badge.description,
        icon: entry.badge.icon,
        awarded_at: entry.awardedAt.toISOString(),
      })),
      pending_note:
        'Doações Pix pendentes ou pagamentos Asaas não confirmados não entram neste total.',
    };
  }

  async getActiveSubscription(donorId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { donorId, status: 'ACTIVE' },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      throw new NotFoundException('Nenhuma assinatura ativa encontrada');
    }

    return subscription;
  }

  private monthsBetween(start: Date, end: Date): number {
    const months =
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth()) +
      1;
    return Math.max(1, months);
  }

  private sanitizeForAudit(profile: ReturnType<DonorService['getProfile']>) {
    return {
      ...profile,
      cpf_cnpj: profile.cpf_cnpj ? '[REDACTED]' : null,
    };
  }
}
