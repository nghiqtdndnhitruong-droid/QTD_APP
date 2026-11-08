import { IdentityCardType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateHeirDto } from './create-borrower.dto.js';

export class UpdateBorrowerDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEnum(IdentityCardType)
  idType?: IdentityCardType;

  @IsOptional()
  @IsString()
  @Matches(/^\d{12}$/, { message: 'Số giấy tờ phải gồm đúng 12 chữ số' })
  idNumber?: string;

  @IsOptional()
  @IsString()
  issueDate?: string;

  @IsOptional()
  @IsString()
  expiryDate?: string | null;

  @IsOptional()
  @IsUUID('4', { message: 'hamletId không hợp lệ' })
  hamletId?: string;

  @IsOptional()
  @IsString()
  memberCode?: string | null;

  @IsOptional()
  @IsString()
  phone?: string | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateHeirDto)
  heir?: CreateHeirDto | null;
}

export class QueryBorrowerDto {
  @IsOptional()
  @IsString()
  search?: string;

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
