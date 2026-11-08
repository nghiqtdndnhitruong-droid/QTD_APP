import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateTerritoryGroupDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên nhóm địa bàn không được để trống' })
  name: string;

  /**
   * Danh sách các ID Xã được gán vào nhóm địa bàn này (nếu có)
   */
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  communeIds?: string[];
}

export class UpdateTerritoryGroupDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  communeIds?: string[];
}

export class CreateCommuneDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên Xã không được để trống' })
  name: string;

  @IsOptional()
  @IsUUID('4')
  territoryGroupId?: string | null;

  /**
   * Có thể truyền kèm danh sách tên các Ấp thuộc Xã khi khởi tạo nhanh
   */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hamletNames?: string[];
}

export class UpdateCommuneDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsUUID('4')
  territoryGroupId?: string | null;
}

export class CreateHamletDto {
  @IsUUID('4', { message: 'communeId không hợp lệ' })
  communeId: string;

  @IsString()
  @IsNotEmpty({ message: 'Tên Ấp không được để trống' })
  name: string;
}

export class UpdateHamletDto {
  @IsOptional()
  @IsUUID('4')
  communeId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;
}

export class QueryHamletDto {
  @IsOptional()
  @IsUUID('4')
  communeId?: string;

  @IsOptional()
  @IsUUID('4')
  territoryGroupId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
