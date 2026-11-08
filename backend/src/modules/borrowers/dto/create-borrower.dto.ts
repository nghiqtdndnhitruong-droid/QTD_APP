import { HeirRelationship } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import {
  BasePersonIdentityDto,
  PersonIdentityWithoutAddressDto,
} from '../../../common/dto/person-identity.dto.js';

export class CreateHeirDto extends BasePersonIdentityDto {
  @IsOptional()
  @IsString()
  phone?: string;

  @IsEnum(HeirRelationship, {
    message:
      'Quan hệ của người thừa kế với người vay phải là một trong: VO, CHONG, CON, CHA, ME',
  })
  relationship: HeirRelationship;
}

export class CreateBorrowerDto extends PersonIdentityWithoutAddressDto {
  /**
   * Địa chỉ người vay lấy từ danh sách địa bàn (Ấp -> Xã -> Tỉnh Vĩnh Long)
   */
  @IsUUID('4', { message: 'Vui lòng chọn địa bàn (hamletId) hợp lệ cho người vay' })
  hamletId: string;

  @IsOptional()
  @IsString()
  memberCode?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  /**
   * 1 Người vay chỉ có thể có 1 người thừa kế hoặc không có người thừa kế
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateHeirDto)
  heir?: CreateHeirDto | null;
}
