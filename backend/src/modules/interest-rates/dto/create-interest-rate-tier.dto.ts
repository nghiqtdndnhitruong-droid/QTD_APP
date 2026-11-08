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

export class CreateInterestRateTierDto {
  @IsEnum(LoanType, {
    message: 'Loại vay phải là TIN_CHAP hoặc THE_CHAP',
  })
  loanType: LoanType;

  @IsEnum(LoanDurationType, {
    message: 'Thời hạn vay phải là NGAN_HAN hoặc TRUNG_HAN',
  })
  durationType: LoanDurationType;

  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'Mốc số tiền tối thiểu không được âm' })
  minAmount: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'Mốc số tiền tối đa phải lớn hơn hoặc bằng 0' })
  maxAmount?: number | null;

  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'Lãi suất phải lớn hơn hoặc bằng 0' })
  interestRate: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
