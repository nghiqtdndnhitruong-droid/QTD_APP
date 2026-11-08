import {
  FundLandCategory,
  LoanDurationType,
  LoanStatus,
  LoanType,
  ValuationType,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  CreateCollateralAssetDto,
  CreateCollateralValuationItemDto,
  CreateHouseholdMemberDto,
  CreateLoanPlanDto,
  CreateLoanPlanItemDto,
  CreateRelatedPersonDto,
} from './create-loan.dto.js';

export class UpdateLoanDto {
  @IsOptional()
  @IsString()
  loanDate?: string;

  @IsOptional()
  @IsString()
  disbursementDate?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  loanAmount?: number;

  @IsOptional()
  @IsString()
  indentureNumber?: string | null;

  @IsOptional()
  @IsEnum(LoanType)
  loanType?: LoanType;

  @IsOptional()
  @IsEnum(LoanDurationType)
  durationType?: LoanDurationType;

  @IsOptional()
  @IsEnum(LoanStatus)
  status?: LoanStatus;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  interestRate?: number;

  @IsOptional()
  @IsString()
  mortgageContractNumber?: string | null;

  @IsOptional()
  @IsString()
  committeeNotarizationDate?: string | null;

  @IsOptional()
  @IsString()
  mortgageContractTermDate?: string | null;

  @IsOptional()
  @IsString()
  valuationDate?: string | null;

  @IsOptional()
  @IsEnum(ValuationType)
  valuationType?: ValuationType | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCollateralAssetDto)
  collateralAssets?: CreateCollateralAssetDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCollateralValuationItemDto)
  valuationItems?: CreateCollateralValuationItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRelatedPersonDto)
  relatedPersons?: CreateRelatedPersonDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateHouseholdMemberDto)
  householdMembers?: CreateHouseholdMemberDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateLoanPlanDto)
  loanPlan?: CreateLoanPlanDto;
}

export class QueryLoanDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID('4')
  borrowerId?: string;

  @IsOptional()
  @IsUUID('4')
  hamletId?: string;

  @IsOptional()
  @IsUUID('4')
  communeId?: string;

  @IsOptional()
  @IsUUID('4')
  territoryGroupId?: string;

  @IsOptional()
  @IsEnum(LoanType)
  loanType?: LoanType;

  @IsOptional()
  @IsEnum(LoanDurationType)
  durationType?: LoanDurationType;

  @IsOptional()
  @IsEnum(LoanStatus)
  status?: LoanStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class PreviewValuationItemDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  area: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  actualArea?: number | null;

  @IsEnum(ValuationType)
  valuationType: ValuationType;

  @IsOptional()
  @IsEnum(FundLandCategory)
  fundLandCategory?: FundLandCategory;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  unitPrice?: number;
}

export class PreviewLoanCalculationDto {
  @IsEnum(LoanType)
  loanType: LoanType;

  @IsEnum(LoanDurationType)
  durationType: LoanDurationType;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  loanAmount: number;

  @IsOptional()
  @IsString()
  disbursementDate?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  totalCapitalNeed?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PreviewValuationItemDto)
  collateralAssets?: PreviewValuationItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLoanPlanItemDto)
  expenses?: CreateLoanPlanItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLoanPlanItemDto)
  revenues?: CreateLoanPlanItemDto[];
}
