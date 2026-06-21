import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class ConsentDto {
  @IsEmail()
  email!: string;

  @IsBoolean()
  analyticsConsent!: boolean;

  @IsBoolean()
  marketingConsent!: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(45)
  ipAddress?: string;
}

export class DataRequestDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MaxLength(255)
  fullName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
