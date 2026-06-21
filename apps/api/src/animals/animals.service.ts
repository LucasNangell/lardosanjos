import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit.service';
import { StorageService } from '../storage/storage.service';
import {
  AdoptionInterestDto,
  CreateAnimalDto,
  ListAnimalsQueryDto,
  ReorderAnimalImagesDto,
  UpdateAnimalDto,
} from './animals.dto';
import { assertValidAnimalImage } from './animals-image.utils';

const animalInclude = {
  coverImage: true,
  images: {
    orderBy: { displayOrder: 'asc' as const },
    include: { uploadedFile: true },
  },
} satisfies Prisma.AnimalInclude;

type AnimalWithRelations = Prisma.AnimalGetPayload<{
  include: typeof animalInclude;
}>;

@Injectable()
export class AnimalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly storageService: StorageService,
  ) {}

  private mapFileUrl(
    file: { id: string; fileKey: string; bucketName: string } | null,
  ) {
    if (!file) return null;
    if (file.bucketName !== 'local' && process.env.CLOUDFLARE_R2_PUBLIC_URL) {
      return `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${file.fileKey}`;
    }
    return `/api/v1/public/files/${file.id}`;
  }

  private mapPublicAnimal(animal: AnimalWithRelations) {
    return {
      id: animal.id,
      name: animal.name,
      species: animal.species,
      gender: animal.gender,
      age: animal.age,
      size: animal.size,
      status: animal.status,
      story: animal.story,
      needs: animal.needs,
      coverImageUrl: this.mapFileUrl(animal.coverImage),
      images: animal.images.map((img) => ({
        id: img.id,
        displayOrder: img.displayOrder,
        url: this.mapFileUrl(img.uploadedFile),
      })),
    };
  }

  private mapAdminAnimal(animal: AnimalWithRelations) {
    return {
      ...this.mapPublicAnimal(animal),
      internalNotes: animal.internalNotes,
      isPublic: animal.isPublic,
      coverImageId: animal.coverImageId,
      images: animal.images.map((img) => ({
        id: img.id,
        displayOrder: img.displayOrder,
        uploadedFileId: img.uploadedFileId,
        url: this.mapFileUrl(img.uploadedFile),
      })),
      createdAt: animal.createdAt.toISOString(),
      updatedAt: animal.updatedAt.toISOString(),
    };
  }

  async findAllPublic(query: ListAnimalsQueryDto) {
    const animals = await this.prisma.animal.findMany({
      where: {
        isPublic: true,
        ...(query.species && { species: query.species }),
        ...(query.size && { size: query.size }),
        ...(query.status && { status: query.status }),
      },
      include: animalInclude,
      orderBy: { createdAt: 'desc' },
    });
    return animals.map((a) => this.mapPublicAnimal(a));
  }

  async findOnePublic(id: string) {
    const animal = await this.prisma.animal.findFirst({
      where: { id, isPublic: true },
      include: animalInclude,
    });
    if (!animal) throw new NotFoundException('Animal não encontrado');
    return this.mapPublicAnimal(animal);
  }

  async findAllAdmin() {
    const animals = await this.prisma.animal.findMany({
      include: animalInclude,
      orderBy: { createdAt: 'desc' },
    });
    return animals.map((a) => this.mapAdminAnimal(a));
  }

  async findOneAdmin(id: string) {
    const animal = await this.prisma.animal.findUnique({
      where: { id },
      include: animalInclude,
    });
    if (!animal) throw new NotFoundException('Animal não encontrado');
    return this.mapAdminAnimal(animal);
  }

  async create(dto: CreateAnimalDto, userId: string) {
    if (dto.coverImageId) {
      await this.assertAnimalImageFile(dto.coverImageId);
    }
    if (dto.images?.length) {
      for (const img of dto.images) {
        await this.assertAnimalImageFile(img.uploadedFileId);
      }
    }

    const animal = await this.prisma.animal.create({
      data: {
        name: dto.name,
        species: dto.species,
        gender: dto.gender,
        age: dto.age,
        size: dto.size,
        status: dto.status,
        story: dto.story,
        needs: dto.needs,
        internalNotes: dto.internalNotes,
        coverImageId: dto.coverImageId,
        isPublic: dto.isPublic ?? true,
        images: dto.images?.length
          ? {
              create: dto.images.map((img, index) => ({
                uploadedFileId: img.uploadedFileId,
                displayOrder: img.displayOrder ?? index,
              })),
            }
          : undefined,
      },
      include: animalInclude,
    });

    await this.audit.log({
      userId,
      action: 'CREATE',
      entity: 'animals',
      entityId: animal.id,
      newData: { name: animal.name, species: animal.species, isPublic: animal.isPublic },
    });

    return this.mapAdminAnimal(animal);
  }

  async update(id: string, dto: UpdateAnimalDto, userId: string) {
    const existing = await this.prisma.animal.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Animal não encontrado');

    if (dto.coverImageId) {
      await this.assertAnimalImageFile(dto.coverImageId);
    }
    if (dto.images?.length) {
      for (const img of dto.images) {
        await this.assertAnimalImageFile(img.uploadedFileId);
      }
    }

    if (dto.images) {
      await this.prisma.animalImage.deleteMany({ where: { animalId: id } });
    }

    const animal = await this.prisma.animal.update({
      where: { id },
      data: {
        name: dto.name,
        species: dto.species,
        gender: dto.gender,
        age: dto.age,
        size: dto.size,
        status: dto.status,
        story: dto.story,
        needs: dto.needs,
        internalNotes: dto.internalNotes,
        coverImageId: dto.coverImageId,
        isPublic: dto.isPublic,
        images: dto.images?.length
          ? {
              create: dto.images.map((img, index) => ({
                uploadedFileId: img.uploadedFileId,
                displayOrder: img.displayOrder ?? index,
              })),
            }
          : undefined,
      },
      include: animalInclude,
    });

    await this.audit.log({
      userId,
      action: 'UPDATE',
      entity: 'animals',
      entityId: id,
      oldData: {
        name: existing.name,
        isPublic: existing.isPublic,
        status: existing.status,
      },
      newData: {
        name: animal.name,
        isPublic: animal.isPublic,
        status: animal.status,
      },
    });

    return this.mapAdminAnimal(animal);
  }

  async reorderImages(
    id: string,
    dto: ReorderAnimalImagesDto,
    userId: string,
  ) {
    const animal = await this.prisma.animal.findUnique({
      where: { id },
      include: { images: true },
    });
    if (!animal) throw new NotFoundException('Animal não encontrado');

    const imageIds = new Set(animal.images.map((img) => img.id));
    for (const item of dto.images) {
      if (!imageIds.has(item.id)) {
        throw new BadRequestException('Imagem não pertence a este animal');
      }
    }

    await this.prisma.$transaction(
      dto.images.map((item, index) =>
        this.prisma.animalImage.update({
          where: { id: item.id },
          data: { displayOrder: item.displayOrder ?? index },
        }),
      ),
    );

    await this.audit.log({
      userId,
      action: 'REORDER_IMAGES',
      entity: 'animals',
      entityId: id,
      newData: { imageOrder: dto.images },
    });

    return this.findOneAdmin(id);
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.animal.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Animal não encontrado');

    await this.prisma.animal.delete({ where: { id } });

    await this.audit.log({
      userId,
      action: 'DELETE',
      entity: 'animals',
      entityId: id,
      oldData: { name: existing.name },
    });

    return { deleted: true };
  }

  async uploadImage(buffer: Buffer, declaredMime: string, userId: string) {
    const mimeType = assertValidAnimalImage(buffer, declaredMime);

    const upload = await this.storageService.upload(
      buffer,
      mimeType,
      'animal-images',
      userId,
    );

    await this.audit.log({
      userId,
      action: 'UPLOAD_IMAGE',
      entity: 'uploaded_files',
      entityId: upload.fileId,
      newData: { folder: 'animal-images', mime_type: mimeType },
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

  async submitAdoptionInterest(animalId: string, dto: AdoptionInterestDto) {
    if (dto.website?.trim()) {
      return { message: 'Interesse registrado com sucesso' };
    }

    const animal = await this.prisma.animal.findFirst({
      where: { id: animalId, isPublic: true },
    });
    if (!animal) throw new NotFoundException('Animal não encontrado');

    const inquiry = await this.prisma.animalAdoptionInquiry.create({
      data: {
        animalId,
        name: dto.name.trim(),
        email: dto.email.trim().toLowerCase(),
        phone: dto.phone?.trim(),
        message: dto.message?.trim(),
      },
    });

    return {
      id: inquiry.id,
      message: 'Interesse registrado com sucesso. Entraremos em contato em breve.',
    };
  }

  private async assertAnimalImageFile(fileId: string) {
    const file = await this.prisma.uploadedFile.findUnique({
      where: { id: fileId },
    });
    if (!file) throw new NotFoundException('Arquivo de imagem não encontrado');
    if (!file.fileKey.startsWith('animal-images/')) {
      throw new BadRequestException('Arquivo inválido para galeria de animal');
    }
    if (!file.mimeType.startsWith('image/')) {
      throw new BadRequestException('Arquivo deve ser uma imagem');
    }
  }
}
