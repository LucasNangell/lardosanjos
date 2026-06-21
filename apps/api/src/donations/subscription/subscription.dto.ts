import {
  Equals,
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum SubscriptionBillingTypeDto {
  CREDIT_CARD = 'CREDIT_CARD',
  BOLETO = 'BOLETO',
}

class SubscriptionCreditCardDto {
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

class SubscriptionCreditCardHolderDto {
  @IsString()
  @MinLength(3)
  name!: string;

  @IsEmail()
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

export class SubscriptionDonationDto {
  @IsUUID()
  plan_id!: string;

  @IsString()
  @MinLength(3)
  donor_name!: string;

  @IsEmail()
  donor_email!: string;

  @IsOptional()
  @IsString()
  donor_phone?: string;

  @IsOptional()
  @IsString()
  cpf_cnpj?: string;

  @IsOptional()
  @IsString()
  postal_code?: string;

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

  @IsEnum(SubscriptionBillingTypeDto)
  billing_type!: SubscriptionBillingTypeDto;

  @IsOptional()
  @IsNumber()
  @Min(10)
  custom_amount?: number;

  @IsBoolean()
  @Equals(true, { message: 'É necessário aceitar os termos de uso' })
  accepts_terms!: boolean;

  @IsBoolean()
  @Equals(true, { message: 'É necessário aceitar a política de privacidade' })
  accepts_privacy!: boolean;

  @IsOptional()
  @IsBoolean()
  wants_public_mural?: boolean;

  @IsOptional()
  @IsBoolean()
  wants_anonymous?: boolean;

  @IsOptional()
  @IsBoolean()
  communication_email?: boolean;

  @IsOptional()
  @IsBoolean()
  communication_whatsapp?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => SubscriptionCreditCardDto)
  credit_card?: SubscriptionCreditCardDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SubscriptionCreditCardHolderDto)
  credit_card_holder?: SubscriptionCreditCardHolderDto;
}

export const CUSTOM_SUBSCRIPTION_PLAN_SLUG = 'valor-personalizado';
export const MIN_CUSTOM_SUBSCRIPTION_AMOUNT = 10;
