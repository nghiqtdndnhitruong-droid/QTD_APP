import {
  CertificateType,
  CollateralAssetType,
  CollateralOwnerType,
  FundLandCategory,
  LoanDurationType,
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
 * Thông tin Tài sản thế chấp (Chỉ chấp nhận Quyền sử dụng đất, địa chỉ lấy từ danh sách địa bàn)
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
   * Địa chỉ thửa đất lấy từ danh sách địa bàn (Ấp -> Xã -> Tỉnh Vĩnh Long), có thể khác địa chỉ người vay
   */
  @IsUUID('4', {
    message: 'Vui lòng chọn địa bàn (hamletId) hợp lệ cho thửa đất thế chấp',
  })
  hamletId: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01, { message: 'Diện tích tài sản phải lớn hơn 0' })
  area: number;

  @IsString()
  @IsNotEmpty({ message: 'Hình thức sử dụng không được để trống' })
  usageForm: string;

  @IsString()
  @IsNotEmpty({ message: 'Mục đích sử dụng không được để trống' })
  usagePurpose: string;

  @IsString()
  @IsNotEmpty({ message: 'Thời hạn sử dụng không được để trống' })
  usageTerm: string;

  @IsString()
  @IsNotEmpty({ message: 'Nguồn gốc sử dụng không được để trống' })
  usageOrigin: string;

  @IsString()
  @IsNotEmpty({ message: 'Hạn chế sử dụng không được để trống' })
  usageRestriction: string;

  @IsEnum(CollateralOwnerType, {
    message:
      'Chủ sở hữu tài sản phải là một trong: NGUOI_VAY_CA_NHAN, NGUOI_VAY_HO, NGUOI_THUA_KE_CA_NHAN, NGUOI_THUA_KE_HO, BAO_LANH',
  })
  ownerType: CollateralOwnerType;

  @IsEnum(ValuationType, {
    message: 'Loại định giá phải là QUY_DINH_QUY hoặc THI_TRUONG',
  })
  valuationType: ValuationType;

  @IsOptional()
  @IsEnum(FundLandCategory, {
    message:
      'Loại đất theo quy định Quỹ phải là: DAT_BINH_THUONG, DAT_CAP_KENH, DAT_CAP_LO_DAT, DAT_CAP_DUONG_NHUA',
  })
  fundLandCategory?: FundLandCategory;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Đơn giá thị trường phải lớn hơn 0' })
  unitPrice?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateGuarantorDto)
  guarantor?: CreateGuarantorDto;
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

  @IsString()
  @IsNotEmpty({ message: 'Ngày giải ngân không được để trống' })
  disbursementDate: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1, { message: 'Số tiền vay phải lớn hơn 0' })
  loanAmount: number;

  @IsString()
  @IsNotEmpty({ message: 'Số khế ước không được để trống' })
  indentureNumber: string;

  @IsEnum(LoanType, { message: 'Loại vay phải là TIN_CHAP hoặc THE_CHAP' })
  loanType: LoanType;

  @IsEnum(LoanDurationType, {
    message: 'Thời hạn vay phải là NGAN_HAN hoặc TRUNG_HAN',
  })
  durationType: LoanDurationType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  interestRate?: number;

  @IsOptional()
  @IsString()
  mortgageContractNumber?: string;

  @IsOptional()
  @IsString()
  committeeNotarizationDate?: string;

  @IsOptional()
  @IsString()
  mortgageContractTermDate?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCollateralAssetDto)
  collateralAssets?: CreateCollateralAssetDto[];

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
