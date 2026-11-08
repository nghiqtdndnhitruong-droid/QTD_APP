import { LoanDurationType, LoanType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

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
