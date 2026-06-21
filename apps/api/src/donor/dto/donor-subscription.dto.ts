import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum DonorSubscriptionBillingTypeDto {
  CREDIT_CARD = 'CREDIT_CARD',
  BOLETO = 'BOLETO',
}

export enum CancelSubscriptionReasonDto {
  FINANCIAL = 'FINANCIAL',
  TEMPORARY = 'TEMPORARY',
  OTHER_CAUSE = 'OTHER_CAUSE',
  NO_ANSWER = 'NO_ANSWER',
  OTHER = 'OTHER',
}

class DonorCreditCardDto {
  @IsString()
  @MinLength(3)
  holder_name!: string;

  @IsString()
  @MinLength(13)
  number!: string;

  @IsString()
  expiry_month!: string;

  @IsString()
  expiry_year!: string;

  @IsString()
  @MinLength(3)
  ccv!: string;
}

class DonorCreditCardHolderDto {
  @IsString()
  @MinLength(3)
  name!: string;

  @IsString()
  email!: string;

  @IsString()
  cpf_cnpj!: string;

  @IsString()
  postal_code!: string;

  @IsString()
  address_number!: string;

  @IsString()
  phone!: string;
}

export class UpdateDonorSubscriptionDto {
  @IsUUID()
  plan_id!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

export class CancelDonorSubscriptionDto {
  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsEnum(CancelSubscriptionReasonDto)
  reason_code?: CancelSubscriptionReasonDto;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateDonorPaymentMethodDto {
  @IsString()
  @MinLength(6)
  password!: string;

  @ValidateNested()
  @Type(() => DonorCreditCardDto)
  credit_card!: DonorCreditCardDto;

  @ValidateNested()
  @Type(() => DonorCreditCardHolderDto)
  credit_card_holder!: DonorCreditCardHolderDto;
}

export class PauseDonorSubscriptionDto {
  @IsString()
  @MinLength(6)
  password!: string;
}
