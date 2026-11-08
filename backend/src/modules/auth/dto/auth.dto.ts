import { IdentityCardType } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterOfficerDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên đăng nhập không được để trống' })
  username: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Họ tên cán bộ không được để trống' })
  fullName: string;

  @IsEnum(IdentityCardType, {
    message:
      'Loại giấy tờ cán bộ phải là CAN_CUOC (Căn cước) hoặc CCCD (Căn cước công dân)',
  })
  idType: IdentityCardType;

  @IsString()
  @Matches(/^\d{12}$/, {
    message: 'Số giấy tờ cán bộ phải gồm đúng 12 chữ số',
  })
  idNumber: string;

  @IsString()
  @IsNotEmpty({ message: 'Ngày cấp giấy tờ không được để trống' })
  issueDate: string;
}

export class LoginOfficerDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên đăng nhập không được để trống' })
  username: string;

  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  password: string;
}
