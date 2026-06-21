import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { PixDonationStatus } from '@lardosanjos/database';

export class ListPixDonationsQueryDto {
  @IsOptional()
  @IsEnum(PixDonationStatus)
  status?: PixDonationStatus;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  min_amount?: string;

  @IsOptional()
  @IsString()
  max_amount?: string;

  @IsOptional()
  @IsString()
  has_receipt?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}

export class PixDonationActionDto {
  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  rejection_reason?: string;
}
