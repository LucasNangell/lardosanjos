import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';
import { CampaignStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateCampaignDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsString()
  @MinLength(10)
  description!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Type(() => Number)
  goalAmount!: number;

  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsUUID()
  animalId?: string;

  @IsOptional()
  @IsUUID()
  coverImageId?: string;
}

export class UpdateCampaignDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Type(() => Number)
  goalAmount?: number;

  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsUUID()
  animalId?: string;

  @IsOptional()
  @IsUUID()
  coverImageId?: string;
}

export class ListCampaignsQueryDto {
  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;
}

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export { slugify };
