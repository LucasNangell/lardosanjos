import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum OnetimeBillingType {
  CREDIT_CARD = 'CREDIT_CARD',
  BOLETO = 'BOLETO',
}

class CreditCardDto {
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

class CreditCardHolderDto {
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

export class OnetimeDonationDto {
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
  campaign_id?: string;

  @IsNumber()
  @Min(1)
  amount!: number;

  @IsEnum(OnetimeBillingType)
  billing_type!: OnetimeBillingType;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreditCardDto)
  credit_card?: CreditCardDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreditCardHolderDto)
  credit_card_holder?: CreditCardHolderDto;
}
