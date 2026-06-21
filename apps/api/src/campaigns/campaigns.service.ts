import { Injectable, NotFoundException } from '@nestjs/common';
import { CampaignStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit.service';
import {
  CreateCampaignDto,
  ListCampaignsQueryDto,
  slugify,
  UpdateCampaignDto,
} from './campaigns.dto';
import { sumConfirmedCampaignDonations } from './campaigns.utils';
import { StorageService } from '../storage/storage.service';
import { assertValidAnimalImage } from '../animals/animals-image.utils';

const campaignInclude = {
  animal: { select: { id: true, name: true, species: true } },
  coverImage: true,
} satisfies Prisma.CampaignInclude;

@Injectable()
export class CampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly storageService: StorageService,
  ) {}

  private mapFileUrl(file: { id: string; fileKey: string; bucketName: string } | null) {
    if (!file) return null;
    if (file.bucketName !== 'local' && process.env.CLOUDFLARE_R2_PUBLIC_URL) {
      return `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${file.fileKey}`;
    }
    return `/api/v1/public/files/${file.id}`;
  }

  private async calculateRaisedAmount(campaignId: string): Promise<number> {
    const donations = await this.prisma.campaignDonation.findMany({
      where: { campaignId },
      include: {
        payment: { select: { value: true, status: true } },
        pixDonation: { select: { amount: true, status: true } },
      },
    });

    return sumConfirmedCampaignDonations(donations);
  }

  private async mapCampaign(
    campaign: Prisma.CampaignGetPayload<{ include: typeof campaignInclude }>,
    withRaised = false,
  ) {
    const raisedAmount = withRaised
      ? await this.calculateRaisedAmount(campaign.id)
      : Number(campaign.raisedAmount);

    return {
      id: campaign.id,
      title: campaign.title,
      slug: campaign.slug,
      description: campaign.description,
      goalAmount: Number(campaign.goalAmount),
      raisedAmount,
      progressPercent: Math.min(
        100,
        Math.round((raisedAmount / Number(campaign.goalAmount)) * 100),
      ),
      status: campaign.status,
      startsAt: campaign.startsAt,
      endsAt: campaign.endsAt,
      animal: campaign.animal,
      coverImageUrl: this.mapFileUrl(campaign.coverImage),
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
    };
  }

  async findAllPublic(query: ListCampaignsQueryDto) {
    const campaigns = await this.prisma.campaign.findMany({
      where: {
        status: query.status ?? CampaignStatus.ACTIVE,
      },
      include: campaignInclude,
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(campaigns.map((c) => this.mapCampaign(c, true)));
  }

  async findOnePublic(slugOrId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        OR: [{ slug: slugOrId }, { id: slugOrId }],
        status: { in: [CampaignStatus.ACTIVE, CampaignStatus.COMPLETED] },
      },
      include: campaignInclude,
    });
    if (!campaign) throw new NotFoundException('Campanha não encontrada');
    return this.mapCampaign(campaign, true);
  }

  async findAllAdmin() {
    const campaigns = await this.prisma.campaign.findMany({
      include: campaignInclude,
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(campaigns.map((c) => this.mapCampaign(c, true)));
  }

  async findOneAdmin(id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: campaignInclude,
    });
    if (!campaign) throw new NotFoundException('Campanha não encontrada');
    return this.mapCampaign(campaign, true);
  }

  private async uniqueSlug(base: string, excludeId?: string): Promise<string> {
    let slug = slugify(base);
    let counter = 0;
    while (true) {
      const candidate = counter === 0 ? slug : `${slug}-${counter}`;
      const existing = await this.prisma.campaign.findFirst({
        where: {
          slug: candidate,
          ...(excludeId && { NOT: { id: excludeId } }),
        },
      });
      if (!existing) return candidate;
      counter++;
    }
  }

  async create(dto: CreateCampaignDto, userId: string) {
    const slug = dto.slug
      ? await this.uniqueSlug(dto.slug)
      : await this.uniqueSlug(dto.title);

    const campaign = await this.prisma.campaign.create({
      data: {
        title: dto.title,
        slug,
        description: dto.description,
        goalAmount: dto.goalAmount,
        status: dto.status ?? CampaignStatus.DRAFT,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
        animalId: dto.animalId,
        coverImageId: dto.coverImageId,
      },
      include: campaignInclude,
    });

    await this.audit.log({
      userId,
      action: 'CREATE',
      entity: 'Campaign',
      entityId: campaign.id,
      newData: { title: campaign.title, slug: campaign.slug },
    });

    return this.mapCampaign(campaign, true);
  }

  async update(id: string, dto: UpdateCampaignDto, userId: string) {
    const existing = await this.prisma.campaign.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Campanha não encontrada');

    const slug = dto.slug
      ? await this.uniqueSlug(dto.slug, id)
      : dto.title
        ? await this.uniqueSlug(dto.title, id)
        : undefined;

    const campaign = await this.prisma.campaign.update({
      where: { id },
      data: {
        title: dto.title,
        slug,
        description: dto.description,
        goalAmount: dto.goalAmount,
        status: dto.status,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
        animalId: dto.animalId,
        coverImageId: dto.coverImageId,
      },
      include: campaignInclude,
    });

    await this.audit.log({
      userId,
      action: 'UPDATE',
      entity: 'Campaign',
      entityId: id,
      oldData: { title: existing.title },
      newData: { title: campaign.title },
    });

    return this.mapCampaign(campaign, true);
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.campaign.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Campanha não encontrada');

    await this.prisma.campaign.delete({ where: { id } });

    await this.audit.log({
      userId,
      action: 'DELETE',
      entity: 'Campaign',
      entityId: id,
      oldData: { title: existing.title },
    });

    return { deleted: true };
  }

  async uploadCoverImage(buffer: Buffer, declaredMime: string, userId: string) {
    const mimeType = assertValidAnimalImage(buffer, declaredMime);

    const upload = await this.storageService.upload(
      buffer,
      mimeType,
      'campaign-images',
      userId,
    );

    await this.audit.log({
      userId,
      action: 'UPLOAD_IMAGE',
      entity: 'uploaded_files',
      entityId: upload.fileId,
      newData: { folder: 'campaign-images' },
    });

    return {
      fileId: upload.fileId,
      mimeType,
      fileSize: upload.fileSize,
      url: this.mapFileUrl({
        id: upload.fileId,
        fileKey: upload.fileKey,
        bucketName: upload.bucketName,
      }),
    };
  }

  async getProgress(id: string) {
    const campaign = await this.findOneAdmin(id);
    return {
      campaign_id: campaign.id,
      goal_amount: campaign.goalAmount,
      raised_amount: campaign.raisedAmount,
      progress_percent: campaign.progressPercent,
    };
  }
}
