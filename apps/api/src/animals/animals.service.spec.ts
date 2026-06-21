import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AnimalsService } from './animals.service';
import { AuditService } from '../common/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import {
  assertValidAnimalImage,
  detectImageMime,
} from './animals-image.utils';

describe('animals-image.utils', () => {
  it('detects jpeg magic bytes', () => {
    const buf = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
    expect(detectImageMime(buf)).toBe('image/jpeg');
  });

  it('rejects invalid buffer', () => {
    expect(() => assertValidAnimalImage(Buffer.from('not-image'), 'image/jpeg')).toThrow(
      BadRequestException,
    );
  });
});

describe('AnimalsService', () => {
  let service: AnimalsService;
  let prisma: {
    animal: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    animalImage: { deleteMany: jest.Mock; update: jest.Mock };
    animalAdoptionInquiry: { create: jest.Mock };
    uploadedFile: { findUnique: jest.Mock };
    $transaction: jest.Mock;
  };
  let audit: { log: jest.Mock };
  let storage: { upload: jest.Mock };

  const baseAnimal = {
    id: '1',
    name: 'Thor',
    species: 'DOG',
    gender: 'MALE',
    age: '2 anos',
    size: 'MEDIUM',
    status: 'Disponível para adoção',
    story: 'História do Thor com detalhes emocionantes',
    needs: 'Vacinas em dia',
    internalNotes: 'Observação interna secreta',
    isPublic: true,
    coverImageId: null,
    coverImage: null,
    images: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    prisma = {
      animal: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      animalImage: { deleteMany: jest.fn(), update: jest.fn() },
      animalAdoptionInquiry: { create: jest.fn() },
      uploadedFile: { findUnique: jest.fn() },
      $transaction: jest.fn((ops) => Promise.all(ops)),
    };
    audit = { log: jest.fn() };
    storage = {
      upload: jest.fn().mockResolvedValue({
        fileId: 'file-1',
        fileKey: 'animal-images/uuid',
        bucketName: 'local',
        fileSize: 1000,
      }),
    };

    service = new AnimalsService(
      prisma as unknown as PrismaService,
      audit as unknown as AuditService,
      storage as unknown as StorageService,
    );
  });

  it('findAllPublic returns only public animals without internal notes', async () => {
    prisma.animal.findMany.mockResolvedValue([baseAnimal]);

    const result = await service.findAllPublic({});
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Thor');
    expect(result[0]).not.toHaveProperty('internalNotes');
    expect(prisma.animal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isPublic: true } }),
    );
  });

  it('findAllPublic applies filters', async () => {
    prisma.animal.findMany.mockResolvedValue([]);
    await service.findAllPublic({
      species: 'CAT',
      size: 'SMALL',
      status: 'Disponível para adoção',
    });
    expect(prisma.animal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isPublic: true,
          species: 'CAT',
          size: 'SMALL',
          status: 'Disponível para adoção',
        },
      }),
    );
  });

  it('findOneAdmin exposes internal notes', async () => {
    prisma.animal.findUnique.mockResolvedValue(baseAnimal);
    const result = await service.findOneAdmin('1');
    expect(result.internalNotes).toBe('Observação interna secreta');
  });

  it('creates animal and audits', async () => {
    prisma.animal.create.mockResolvedValue(baseAnimal);
    const result = await service.create(
      {
        name: 'Thor',
        species: 'DOG',
        gender: 'MALE',
        status: 'Disponível para adoção',
        story: 'História do Thor com detalhes emocionantes',
        isPublic: true,
      },
      'admin-1',
    );
    expect(result.name).toBe('Thor');
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CREATE', entity: 'animals' }),
    );
  });

  it('updates publish status', async () => {
    prisma.animal.findUnique.mockResolvedValue(baseAnimal);
    prisma.animal.update.mockResolvedValue({ ...baseAnimal, isPublic: false });

    const result = await service.update('1', { isPublic: false }, 'admin-1');
    expect(result.isPublic).toBe(false);
  });

  it('uploads valid image to animal-images folder', async () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0]);
    const result = await service.uploadImage(jpeg, 'image/jpeg', 'admin-1');
    expect(result.fileId).toBe('file-1');
    expect(storage.upload).toHaveBeenCalledWith(
      jpeg,
      'image/jpeg',
      'animal-images',
      'admin-1',
    );
  });

  it('rejects invalid image upload', async () => {
    await expect(
      service.uploadImage(Buffer.from('fake'), 'image/jpeg', 'admin-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('registers adoption interest for public animal', async () => {
    prisma.animal.findFirst.mockResolvedValue(baseAnimal);
    prisma.animalAdoptionInquiry.create.mockResolvedValue({ id: 'inq-1' });

    const result = await service.submitAdoptionInterest('1', {
      name: 'Maria',
      email: 'maria@test.com',
      message: 'Quero adotar',
    });

    expect(result.message).toContain('sucesso');
    expect(prisma.animalAdoptionInquiry.create).toHaveBeenCalled();
  });

  it('silently ignores honeypot submissions', async () => {
    const result = await service.submitAdoptionInterest('1', {
      name: 'Bot',
      email: 'bot@spam.com',
      website: 'http://spam.com',
    });
    expect(result.message).toContain('sucesso');
    expect(prisma.animalAdoptionInquiry.create).not.toHaveBeenCalled();
  });

  it('throws when public animal not found for adoption', async () => {
    prisma.animal.findFirst.mockResolvedValue(null);
    await expect(
      service.submitAdoptionInterest('missing', {
        name: 'Maria',
        email: 'maria@test.com',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
