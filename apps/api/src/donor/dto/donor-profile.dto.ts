import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { DonorPublicDisplayType } from '@lardosanjos/database';

export class UpdateDonorProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  full_name?: string;

  @IsOptional()
  @IsString()
  public_name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  cpf_cnpj?: string;

  @IsOptional()
  @IsDateString()
  birth_date?: string;

  @IsOptional()
  @IsString()
  zip_code?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  address_number?: string;

  @IsOptional()
  @IsString()
  address_complement?: string;

  @IsOptional()
  @IsString()
  neighborhood?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsBoolean()
  wants_public_profile?: boolean;

  @IsOptional()
  @IsEnum(DonorPublicDisplayType)
  public_display_type?: DonorPublicDisplayType;

  @IsOptional()
  @IsBoolean()
  communication_email?: boolean;

  @IsOptional()
  @IsBoolean()
  communication_whatsapp?: boolean;
}
