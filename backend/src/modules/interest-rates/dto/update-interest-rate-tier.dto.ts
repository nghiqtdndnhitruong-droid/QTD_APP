import { LoanDurationType, LoanType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateInterestRateTierDto } from './create-interest-rate-tier.dto.js';

export class UpdateInterestRateTierDto {
  @IsOptional()
  @IsEnum(LoanType)
  loanType?: LoanType;

  @IsOptional()
  @IsEnum(LoanDurationType)
  durationType?: LoanDurationType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxAmount?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  interestRate?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateInterestRateBatchDto {
  @IsOptional()
  @IsString()
  effectiveDate?: string;

  @IsOptional()
  @IsString()
  documentNote?: string | null;

  @IsOptional()
  @IsBoolean()
  isApplied?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInterestRateTierDto)
  tiers?: CreateInterestRateTierDto[];
}

export class QueryInterestRateTierDto {
  @IsOptional()
  @IsEnum(LoanType)
  loanType?: LoanType;

  @IsOptional()
  @IsEnum(LoanDurationType)
  durationType?: LoanDurationType;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}

export class LookupInterestRateDto {
  @IsEnum(LoanType)
  loanType: LoanType;

  @IsEnum(LoanDurationType)
  durationType: LoanDurationType;

  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Số tiền vay phải lớn hơn 0' })
  loanAmount: number;
}
