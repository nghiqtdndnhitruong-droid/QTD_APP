import {
  CertificateType,
  CollateralAssetType,
  CollateralOwnerType,
  FundLandCategory,
  LoanDurationType,
  LoanStatus,
  LoanType,
  RelatedPersonRelationship,
  ValuationType,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { BasePersonIdentityDto } from '../../../common/dto/person-identity.dto.js';
import { CreateBorrowerDto } from '../../borrowers/dto/create-borrower.dto.js';

/**
 * Thông tin Người bảo lãnh (khi chủ sở hữu tài sản là BAO_LANH - chỉ có 1 người bảo lãnh, địa chỉ nhập tự do)
 */
export class CreateGuarantorDto extends BasePersonIdentityDto {}

/**
 * Thông tin Tài sản thế chấp (Chỉ chấp nhận Quyền sử dụng đất, địa chỉ lấy từ danh sách địa bàn cấp Ấp hoặc cấp Xã)
 */
export class CreateCollateralAssetDto {
  @IsEnum(CollateralAssetType, {
    message:
      'Tên loại tài sản phải là một trong: QSDD, QSDD_NHA_O_TAI_SAN, QSDD_TAI_SAN',
  })
  assetType: CollateralAssetType;

  @IsString()
  @IsNotEmpty({ message: 'Mã số tài sản không được để trống' })
  assetCode: string;

  @IsEnum(CertificateType, {
    message:
      'Loại giấy chứng nhận phải là một trong: GCN, GIAY_CHUNG_NHAN, VAO_SO_CAP_GCN_SO, SO_VAO_SO_CAP_GCN',
  })
  certificateType: CertificateType;

  @IsString()
  @IsNotEmpty({ message: 'Số giấy chứng nhận không được để trống' })
  certificateNumber: string;

  @IsString()
  @IsNotEmpty({ message: 'Số thửa không được để trống' })
  plotNumber: string;

  @IsString()
  @IsNotEmpty({ message: 'Số tờ không được để trống' })
  mapSheetNumber: string;

  /**
   * Địa chỉ thửa đất có thể chọn từ cấp Ấp (hamletId) hoặc cấp Xã (communeId)
   */
  @IsOptional()
  @IsUUID('4', {
    message: 'Vui lòng chọn địa bàn cấp Ấp (hamletId) hợp lệ',
  })
  hamletId?: string | null;

  @IsOptional()
  @IsUUID('4', {
    message: 'Vui lòng chọn địa bàn cấp Xã (communeId) hợp lệ',
  })
  communeId?: string | null;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01, { message: 'Diện tích tài sản phải lớn hơn 0' })
  area: number;

  @IsOptional()
  @IsString()
  usageForm?: string | null;

  @IsOptional()
  @IsString()
  usagePurpose?: string | null;

  @IsString()
  @IsNotEmpty({ message: 'Thời hạn sử dụng không được để trống' })
  usageTerm: string;

  @IsOptional()
  @IsString()
  usageOrigin?: string | null;

  @IsOptional()
  @IsString()
  usageRestriction?: string | null;

  @IsEnum(CollateralOwnerType, {
    message:
      'Chủ sở hữu tài sản phải là một trong: NGUOI_VAY_CA_NHAN, NGUOI_VAY_HO, NGUOI_THUA_KE_CA_NHAN, NGUOI_THUA_KE_HO, BAO_LANH',
  })
  ownerType: CollateralOwnerType;

  @IsOptional()
  @IsEnum(ValuationType, {
    message: 'Loại định giá phải là QUY_DINH_QUY hoặc THI_TRUONG',
  })
  valuationType?: ValuationType | null;

  @IsOptional()
  @IsEnum(FundLandCategory, {
    message:
      'Loại đất theo quy định Quỹ phải là: DAT_BINH_THUONG, DAT_CAP_KENH, DAT_CAP_LO_DAT, DAT_CAP_DUONG_NHUA',
  })
  fundLandCategory?: FundLandCategory | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'Đơn giá không được âm' })
  unitPrice?: number | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateGuarantorDto)
  guarantor?: CreateGuarantorDto;
}

/**
 * Một dòng trong bảng Định giá Tài sản Thế chấp (Section riêng khi vay Thế chấp)
 */
export class CreateCollateralValuationItemDto {
  @IsString()
  @IsNotEmpty({ message: 'Số thửa trong bảng định giá không được để trống' })
  plotNumber: string;

  @IsString()
  @IsNotEmpty({ message: 'Số tờ trong bảng định giá không được để trống' })
  mapSheetNumber: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01, { message: 'Diện tích trong bảng định giá phải lớn hơn 0' })
  area: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01, { message: 'Diện tích thực tế định giá phải lớn hơn 0' })
  actualArea?: number | null;

  @IsOptional()
  @IsEnum(FundLandCategory, {
    message:
      'Loại đất theo quy định Quỹ phải là: DAT_BINH_THUONG, DAT_CAP_KENH, DAT_CAP_LO_DAT, DAT_CAP_DUONG_NHUA',
  })
  fundLandCategory?: FundLandCategory | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'Đơn giá định giá không được âm' })
  unitPrice?: number | null;

  @IsOptional()
  @IsString()
  note?: string | null;
}

/**
 * Thông tin Người liên quan (Bắt buộc khi vay Thế chấp >= 140.000.000đ, địa chỉ nhập tự do)
 */
export class CreateRelatedPersonDto extends BasePersonIdentityDto {
  @IsOptional()
  @IsString()
  phone?: string;

  @IsEnum(RelatedPersonRelationship, {
    message:
      'Quan hệ của người liên quan phải là một trong: CON, CHA, ME, ANH, CHI, EM, CO, DI, CAU',
  })
  relationship: RelatedPersonRelationship;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'Vốn vay ở quỹ không được âm' })
  existingLoanAtFund?: number | null;
}

/**
 * Thông tin Người trong hộ (Quản lý chung theo khoản vay, có thể bỏ trống, địa chỉ nhập tự do)
 */
export class CreateHouseholdMemberDto extends BasePersonIdentityDto {
  @IsOptional()
  @IsString()
  phone?: string;
}

/**
 * Một dòng Chi phí hoặc Nguồn thu trong Phương án vay vốn (Chỉ có tên khoản mục và số tiền)
 */
export class CreateLoanPlanItemDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên khoản mục không được để trống' })
  itemName: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'Số tiền khoản mục không được âm' })
  amount: number;
}

/**
 * Phương án vay vốn của khoản vay
 */
export class CreateLoanPlanDto {
  @IsString()
  @IsNotEmpty({ message: 'Mục đích vay vốn không được để trống' })
  loanPurpose: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Tổng nhu cầu vốn của phương án phải lớn hơn 0' })
  totalCapitalNeed: number;

  @IsArray()
  @ArrayMinSize(1, { message: 'Danh sách chi phí phải có ít nhất 1 khoản mục' })
  @ValidateNested({ each: true })
  @Type(() => CreateLoanPlanItemDto)
  expenses: CreateLoanPlanItemDto[];

  @IsArray()
  @ArrayMinSize(1, {
    message: 'Danh sách nguồn thu phải có ít nhất 1 khoản mục',
  })
  @ValidateNested({ each: true })
  @Type(() => CreateLoanPlanItemDto)
  revenues: CreateLoanPlanItemDto[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  fundLoanCapital?: number;
}

/**
 * DTO Tạo mới Khoản vay đầy đủ
 */
export class CreateLoanDto {
  @IsOptional()
  @IsUUID('4', { message: 'borrowerId không hợp lệ' })
  borrowerId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateBorrowerDto)
  borrower?: CreateBorrowerDto;

  @IsString()
  @IsNotEmpty({ message: 'Ngày vay không được để trống' })
  loanDate: string;

  @IsOptional()
  @IsString()
  disbursementDate?: string | null;

  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Số tiền vay phải lớn hơn 0' })
  loanAmount: number;

  @IsOptional()
  @IsString()
  indentureNumber?: string | null;

  @IsEnum(LoanType, { message: 'Loại vay phải là TIN_CHAP hoặc THE_CHAP' })
  loanType: LoanType;

  @IsEnum(LoanDurationType, {
    message: 'Thời hạn vay phải là NGAN_HAN hoặc TRUNG_HAN',
  })
  durationType: LoanDurationType;

  @IsOptional()
  @IsEnum(LoanStatus, {
    message: 'Trạng thái khoản vay không hợp lệ',
  })
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
  @IsEnum(ValuationType, {
    message: 'Loại định giá phải là QUY_DINH_QUY hoặc THI_TRUONG',
  })
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

  @ValidateNested()
  @Type(() => CreateLoanPlanDto)
  loanPlan: CreateLoanPlanDto;
}
