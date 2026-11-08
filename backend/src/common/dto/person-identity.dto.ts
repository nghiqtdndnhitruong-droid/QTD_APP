import { IdentityCardType } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

/**
 * DTO cơ sở cho định danh cá nhân (chưa gồm trường địa chỉ)
 */
export class PersonIdentityWithoutAddressDto {
  @IsString()
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  fullName: string;

  @IsEnum(IdentityCardType, {
    message:
      'Loại giấy tờ phải là CAN_CUOC (Căn cước) hoặc CCCD (Căn cước công dân)',
  })
  idType: IdentityCardType;

  @IsString()
  @Matches(/^\d{12}$/, {
    message: 'Số giấy tờ phải gồm đúng 12 chữ số',
  })
  idNumber: string;

  @IsString()
  @IsNotEmpty({ message: 'Ngày cấp giấy tờ không được để trống' })
  issueDate: string;

  @IsOptional()
  @IsString()
  expiryDate?: string;
}

/**
 * DTO cơ sở cho các đối tượng phụ nhập địa chỉ tự do
 * (Người thừa kế, Người bảo lãnh, Người liên quan, Người trong hộ)
 */
export class BasePersonIdentityDto extends PersonIdentityWithoutAddressDto {
  @IsString()
  @IsNotEmpty({ message: 'Địa chỉ không được để trống' })
  address: string;
}

/**
 * Bản ghi DB chứa các trường định danh cá nhân (đã validate khi create)
 */
export interface PersonIdentityRecord {
  fullName: string;
  idType: IdentityCardType;
  idNumber: string;
  issueDate: Date;
  expiryDate: Date | null;
  address: string;
}

/**
 * Chuyển bản ghi định danh đã lưu trong DB về dạng DTO (issueDate/expiryDate -> chuỗi ISO)
 * Dùng khi update: đọc lại dữ liệu cũ từ DB và chạy lại pipeline validate.
 */
export function buildIdentityDtoFromRecord<T extends PersonIdentityRecord>(
  record: T,
): Omit<T, 'issueDate' | 'expiryDate'> & {
  issueDate: string;
  expiryDate: string | undefined;
} {
  const { issueDate, expiryDate, ...rest } = record;
  return {
    ...rest,
    issueDate: issueDate.toISOString(),
    expiryDate: expiryDate ? expiryDate.toISOString() : undefined,
  };
}
