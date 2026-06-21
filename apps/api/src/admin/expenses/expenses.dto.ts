import {
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';

export class CreateExpenseCategoryDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateExpenseCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class CreateExpenseDto {
  @IsUUID()
  category_id!: string;

  @IsString()
  @MinLength(2)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @MinLength(2)
  public_description!: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsString()
  supplier?: string;

  @IsOptional()
  @IsUUID()
  receipt_file_id?: string;

  @IsOptional()
  @IsBoolean()
  is_public?: boolean;
}

export class UpdateExpenseDto {
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  public_description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  supplier?: string;

  @IsOptional()
  @IsUUID()
  receipt_file_id?: string;

  @IsOptional()
  @IsBoolean()
  is_public?: boolean;
}

export class CloseTransparencyReportDto {
  @IsNumber()
  @Min(1)
  month!: number;

  @IsNumber()
  @Min(2000)
  year!: number;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsBoolean()
  publish?: boolean;
}
