import {
  IsBoolean,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { DonorPublicDisplayType } from '@lardosanjos/database';

export class UpdateDonorPrivacyDto {
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
