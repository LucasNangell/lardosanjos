import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AnimalGender, AnimalSize, AnimalSpecies } from '@prisma/client';

export class AnimalImageDto {
  @IsUUID()
  uploadedFileId!: string;

  @IsOptional()
  displayOrder?: number;
}

export class CreateAnimalDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsEnum(AnimalSpecies)
  species!: AnimalSpecies;

  @IsEnum(AnimalGender)
  gender!: AnimalGender;

  @IsOptional()
  @IsString()
  age?: string;

  @IsOptional()
  @IsEnum(AnimalSize)
  size?: AnimalSize;

  @IsString()
  @MinLength(1)
  status!: string;

  @IsString()
  @MinLength(10)
  story!: string;

  @IsOptional()
  @IsString()
  needs?: string;

  @IsOptional()
  @IsString()
  internalNotes?: string;

  @IsOptional()
  @IsUUID()
  coverImageId?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnimalImageDto)
  images?: AnimalImageDto[];
}

export class UpdateAnimalDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsEnum(AnimalSpecies)
  species?: AnimalSpecies;

  @IsOptional()
  @IsEnum(AnimalGender)
  gender?: AnimalGender;

  @IsOptional()
  @IsString()
  age?: string;

  @IsOptional()
  @IsEnum(AnimalSize)
  size?: AnimalSize;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  story?: string;

  @IsOptional()
  @IsString()
  needs?: string;

  @IsOptional()
  @IsString()
  internalNotes?: string;

  @IsOptional()
  @IsUUID()
  coverImageId?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnimalImageDto)
  images?: AnimalImageDto[];
}

export class ReorderAnimalImagesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnimalImageOrderDto)
  images!: AnimalImageOrderDto[];
}

export class AnimalImageOrderDto {
  @IsUUID()
  id!: string;

  @IsOptional()
  displayOrder?: number;
}

export class AdoptionInterestDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  message?: string;

  /** Honeypot — bots preenchem; humanos não veem este campo */
  @IsOptional()
  @IsString()
  website?: string;
}

export class ListAnimalsQueryDto {
  @IsOptional()
  @IsEnum(AnimalSpecies)
  species?: AnimalSpecies;

  @IsOptional()
  @IsEnum(AnimalSize)
  size?: AnimalSize;

  @IsOptional()
  @IsString()
  status?: string;
}
