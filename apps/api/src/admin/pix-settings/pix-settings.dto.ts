import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PixKeyType } from '@lardosanjos/database';

export class UpdatePixSettingsDto {
  @IsString()
  receiver_name!: string;

  @IsString()
  receiver_city!: string;

  @IsString()
  pix_key!: string;

  @IsEnum(PixKeyType)
  pix_key_type!: PixKeyType;

  @IsOptional()
  @IsString()
  default_description?: string;

  @IsOptional()
  @IsString()
  default_txid?: string;

  @IsNumber()
  @Min(0.01)
  min_amount!: number;

  @IsBoolean()
  allow_custom_amount!: boolean;

  @IsOptional()
  @IsArray()
  quick_amounts?: number[];

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsBoolean()
  require_donor_data!: boolean;

  @IsBoolean()
  require_receipt_upload!: boolean;

  @IsBoolean()
  hide_sensitive_details!: boolean;

  @IsBoolean()
  is_active!: boolean;

  @IsOptional()
  @IsString()
  environment?: string;
}

export class TestPixSettingsDto {
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsString()
  receiver_name?: string;

  @IsOptional()
  @IsString()
  receiver_city?: string;

  @IsOptional()
  @IsString()
  pix_key?: string;

  @IsOptional()
  @IsEnum(PixKeyType)
  pix_key_type?: PixKeyType;

  @IsOptional()
  @IsString()
  default_description?: string;

  @IsOptional()
  @IsString()
  default_txid?: string;
}
