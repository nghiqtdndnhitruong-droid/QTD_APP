import {
  CollateralOwnerType,
  FundLandCategory,
  IdentityCardType,
  LoanDurationType,
} from '@prisma/client';

/**
 * Nơi cấp giấy tờ tự động theo loại giấy tờ
 */
export const ISSUING_AUTHORITY_BY_ID_TYPE: Record<IdentityCardType, string> = {
  [IdentityCardType.CAN_CUOC]: 'Bộ Công An',
  [IdentityCardType.CCCD]: 'Cục CSQLHC về TTXH',
};

/**
 * Hạn mức vay tối đa cho Tín chấp (100.000.000đ)
 */
export const MAX_UNSECURED_LOAN_AMOUNT = 100_000_000;

/**
 * Tỷ lệ cho vay tối đa trên tổng định giá tài sản thế chấp (70%)
 */
export const MAX_SECURED_VALUATION_RATIO = 0.7;

/**
 * Ngưỡng số tiền vay Thế chấp bắt buộc phải có Người liên quan (140.000.000đ)
 */
export const RELATED_PERSON_MANDATORY_THRESHOLD = 140_000_000;

/**
 * Đơn vị làm tròn xuống khi định giá tài sản (1.000.000đ)
 */
export const VALUATION_ROUNDING_UNIT = 1_000_000;

/**
 * Số tháng mặc định theo thời hạn vay
 */
export const DEFAULT_LOAN_DURATION_MONTHS: Record<LoanDurationType, number> = {
  [LoanDurationType.NGAN_HAN]: 12,
  [LoanDurationType.TRUNG_HAN]: 24,
};

/**
 * Đơn giá định giá cố định theo Nghị định/Quy định Quỹ (VNĐ/m2)
 */
export const FUND_REGULATION_UNIT_PRICES: Record<FundLandCategory, number> = {
  [FundLandCategory.DAT_BINH_THUONG]: 60_000,
  [FundLandCategory.DAT_CAP_KENH]: 70_000,
  [FundLandCategory.DAT_CAP_LO_DAT]: 100_000,
  [FundLandCategory.DAT_CAP_DUONG_NHUA]: 150_000,
};

/**
 * Các loại chủ sở hữu tài sản thuộc nhóm Đất hộ
 */
export const HOUSEHOLD_OWNER_TYPES: ReadonlySet<CollateralOwnerType> = new Set([
  CollateralOwnerType.NGUOI_VAY_HO,
  CollateralOwnerType.NGUOI_THUA_KE_HO,
]);
