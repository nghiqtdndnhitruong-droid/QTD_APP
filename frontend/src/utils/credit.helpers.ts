import {
  CertificateType,
  CollateralAssetType,
  CollateralOwnerType,
  FundLandCategory,
  Gender,
  HeirRelationship,
  IdentityCardType,
  LoanDurationType,
  LoanStatus,
  LoanType,
  RelatedPersonRelationship,
  ValuationType,
} from '../types/credit.types';

export const ID_TYPE_OPTIONS: Array<{ label: string; value: IdentityCardType }> =
  [
    { label: 'Căn cước (Bộ Công An)', value: 'CAN_CUOC' },
    { label: 'Căn cước công dân (Cục CSQLHC về TTXH)', value: 'CCCD' },
  ];

export const HEIR_RELATIONSHIP_OPTIONS: Array<{
  label: string;
  value: HeirRelationship;
}> = [
  { label: 'Vợ', value: 'VO' },
  { label: 'Chồng', value: 'CHONG' },
  { label: 'Con', value: 'CON' },
  { label: 'Cha', value: 'CHA' },
  { label: 'Mẹ', value: 'ME' },
];

export const RELATED_PERSON_RELATIONSHIP_OPTIONS: Array<{
  label: string;
  value: RelatedPersonRelationship;
}> = [
  { label: 'Con', value: 'CON' },
  { label: 'Cha', value: 'CHA' },
  { label: 'Mẹ', value: 'ME' },
  { label: 'Anh', value: 'ANH' },
  { label: 'Chị', value: 'CHI' },
  { label: 'Em', value: 'EM' },
  { label: 'Cô', value: 'CO' },
  { label: 'Dì', value: 'DI' },
  { label: 'Cậu', value: 'CAU' },
];

export const LOAN_TYPE_OPTIONS: Array<{ label: string; value: LoanType }> = [
  { label: 'Tín chấp (Tối đa 100 triệu đồng)', value: 'TIN_CHAP' },
  { label: 'Thế chấp (Tối đa 70% định giá tài sản)', value: 'THE_CHAP' },
];

export const LOAN_DURATION_OPTIONS: Array<{
  label: string;
  value: LoanDurationType;
}> = [
  { label: 'Ngắn hạn (12 tháng)', value: 'NGAN_HAN' },
  { label: 'Trung hạn (24 tháng)', value: 'TRUNG_HAN' },
];

export const LOAN_STATUS_OPTIONS: Array<{
  label: string;
  value: LoanStatus;
  color: string;
}> = [
  {
    label: 'Đang chuẩn bị hồ sơ',
    value: 'DANG_CHUAN_BI_HO_SO',
    color: 'default',
  },
  {
    label: 'Đã hoàn thành hồ sơ',
    value: 'DA_HOAN_THANH_HO_SO',
    color: 'processing',
  },
  {
    label: 'Đã giải ngân',
    value: 'DA_GIAI_NGAN',
    color: 'success',
  },
  {
    label: 'Đã tất toán',
    value: 'DA_TAT_TOAN',
    color: 'cyan',
  },
  {
    label: 'Quá hạn',
    value: 'QUA_HAN',
    color: 'error',
  },
];

export const COLLATERAL_ASSET_TYPE_OPTIONS: Array<{
  label: string;
  value: CollateralAssetType;
}> = [
  { label: 'Quyền sử dụng đất', value: 'QSDD' },
  {
    label:
      'Quyền sử dụng đất quyền sở hữu nhà ở và tài sản khác gắn liền với đất',
    value: 'QSDD_NHA_O_TAI_SAN',
  },
  {
    label: 'Quyền sử dụng đất, quyền sở hữu tài sản gắn liền với đất',
    value: 'QSDD_TAI_SAN',
  },
];

export const CERTIFICATE_TYPE_OPTIONS: Array<{
  label: string;
  value: CertificateType;
}> = [
  { label: 'GCN', value: 'GCN' },
  { label: 'Giấy chứng nhận', value: 'GIAY_CHUNG_NHAN' },
  {
    label: 'Vào sổ cấp giấy chứng nhận quyền sử dụng đất Số',
    value: 'VAO_SO_CAP_GCN_SO',
  },
  {
    label: 'Số vào sổ cấp giấy chứng nhận quyền sử dụng đất',
    value: 'SO_VAO_SO_CAP_GCN',
  },
];

export const COLLATERAL_OWNER_TYPE_OPTIONS: Array<{
  label: string;
  value: CollateralOwnerType;
}> = [
  { label: 'Người vay cá nhân', value: 'NGUOI_VAY_CA_NHAN' },
  { label: 'Người vay hộ (Đất hộ)', value: 'NGUOI_VAY_HO' },
  { label: 'Người thừa kế cá nhân', value: 'NGUOI_THUA_KE_CA_NHAN' },
  { label: 'Người thừa kế hộ (Đất hộ)', value: 'NGUOI_THUA_KE_HO' },
  { label: 'Bảo lãnh (1 Người bảo lãnh)', value: 'BAO_LANH' },
];

export const VALUATION_TYPE_OPTIONS: Array<{
  label: string;
  value: ValuationType;
}> = [
  { label: 'Theo quy định Quỹ', value: 'QUY_DINH_QUY' },
  { label: 'Theo giá thị trường', value: 'THI_TRUONG' },
];

export const FUND_LAND_CATEGORY_OPTIONS: Array<{
  label: string;
  value: FundLandCategory;
  unitPrice: number;
}> = [
  {
    label: 'Đất bình thường (60.000đ/m²)',
    value: 'DAT_BINH_THUONG',
    unitPrice: 60_000,
  },
  {
    label: 'Đất cập kênh (70.000đ/m²)',
    value: 'DAT_CAP_KENH',
    unitPrice: 70_000,
  },
  {
    label: 'Đất cập lộ đất (100.000đ/m²)',
    value: 'DAT_CAP_LO_DAT',
    unitPrice: 100_000,
  },
  {
    label: 'Đất cập đường nhựa (150.000đ/m²)',
    value: 'DAT_CAP_DUONG_NHUA',
    unitPrice: 150_000,
  },
];

export const FUND_UNIT_PRICE_MAP: Record<FundLandCategory, number> = {
  DAT_BINH_THUONG: 60_000,
  DAT_CAP_KENH: 70_000,
  DAT_CAP_LO_DAT: 100_000,
  DAT_CAP_DUONG_NHUA: 150_000,
};

// ==========================================
// HÀM BIÊN DỊCH ENUM SANG NGÔN NGỮ TIẾNG VIỆT DỄ HIỂU
// ==========================================

export function getIdTypeLabel(v?: IdentityCardType | string | null): string {
  if (v === 'CAN_CUOC') return 'Căn cước';
  if (v === 'CCCD') return 'Căn cước công dân';
  return v || '—';
}

export function getHeirRelationshipLabel(
  v?: HeirRelationship | string | null,
): string {
  const found = HEIR_RELATIONSHIP_OPTIONS.find((o) => o.value === v);
  return found ? found.label : v || '—';
}

export function getRelatedPersonRelationshipLabel(
  v?: RelatedPersonRelationship | string | null,
): string {
  const found = RELATED_PERSON_RELATIONSHIP_OPTIONS.find((o) => o.value === v);
  return found ? found.label : v || '—';
}

export function getCollateralOwnerTypeLabel(
  v?: CollateralOwnerType | string | null,
): string {
  const found = COLLATERAL_OWNER_TYPE_OPTIONS.find((o) => o.value === v);
  return found ? found.label : v || '—';
}

export function getCollateralAssetTypeLabel(
  v?: CollateralAssetType | string | null,
): string {
  const found = COLLATERAL_ASSET_TYPE_OPTIONS.find((o) => o.value === v);
  return found ? found.label : v || '—';
}

export function getCertificateTypeLabel(
  v?: CertificateType | string | null,
): string {
  const found = CERTIFICATE_TYPE_OPTIONS.find((o) => o.value === v);
  return found ? found.label : v || '—';
}

export function getValuationTypeLabel(
  v?: ValuationType | string | null,
): string {
  const found = VALUATION_TYPE_OPTIONS.find((o) => o.value === v);
  return found ? found.label : v || '—';
}

export function getFundLandCategoryLabel(
  v?: FundLandCategory | string | null,
): string {
  const found = FUND_LAND_CATEGORY_OPTIONS.find((o) => o.value === v);
  return found ? found.label : v || '—';
}

export function getLoanStatusMeta(v?: LoanStatus | string | null): {
  label: string;
  color: string;
} {
  const found = LOAN_STATUS_OPTIONS.find((o) => o.value === v);
  return found ?? { label: v || 'Đang chuẩn bị hồ sơ', color: 'default' };
}

/**
 * Lấy ngày hôm nay theo định dạng dd/mm/yyyy
 */
export function getTodayDDMMYYYY(): string {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  return `${d}/${m}/${y}`;
}

/**
 * Tự động lấy Nơi cấp theo Loại giấy tờ
 */
export function getIssuingAuthorityByIdType(
  idType?: IdentityCardType,
): string {
  if (idType === 'CAN_CUOC') return 'Bộ Công An';
  if (idType === 'CCCD') return 'Cục CSQLHC về TTXH';
  return '';
}

/**
 * Tách Giới tính và Năm sinh từ Số giấy tờ 12 số (tính vị trí từ 1):
 * - Vị trí thứ 4: 0/2 -> Nam, 1/3 -> Nữ (0,1 -> 19xx; 2,3 -> 20xx)
 * - Vị trí thứ 5, 6: 2 số cuối năm sinh
 */
export function parseTwelveDigitIdCard(idNumber?: string): {
  isValid: boolean;
  gender?: Gender;
  genderLabel?: string;
  birthYear?: number;
  error?: string;
} {
  const clean = (idNumber ?? '').trim();
  if (!/^\d{12}$/.test(clean)) {
    return {
      isValid: false,
      error: 'Số giấy tờ phải gồm đúng 12 chữ số',
    };
  }

  const fourthDigit = clean.charAt(3);
  const yearSuffix = Number.parseInt(clean.slice(4, 6), 10);

  switch (fourthDigit) {
    case '0':
      return {
        isValid: true,
        gender: 'NAM',
        genderLabel: 'Nam',
        birthYear: 1900 + yearSuffix,
      };
    case '1':
      return {
        isValid: true,
        gender: 'NU',
        genderLabel: 'Nữ',
        birthYear: 1900 + yearSuffix,
      };
    case '2':
      return {
        isValid: true,
        gender: 'NAM',
        genderLabel: 'Nam',
        birthYear: 2000 + yearSuffix,
      };
    case '3':
      return {
        isValid: true,
        gender: 'NU',
        genderLabel: 'Nữ',
        birthYear: 2000 + yearSuffix,
      };
    default:
      return {
        isValid: false,
        error: 'Chữ số thứ 4 phải là 0, 1, 2 hoặc 3',
      };
  }
}

/**
 * Làm tròn xuống hàng triệu (VD: 15.200.000 -> 15.000.000)
 */
export function roundDownToMillion(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  return Math.floor(amount / 1_000_000) * 1_000_000;
}

/**
 * Tính định giá tài sản thế chấp:
 * - Nếu có diện tích thực tế định giá (actualArea > 0) thì lấy actualArea, ngược lại lấy area
 * - Nhân với đơn giá (theo quy định Quỹ hoặc giá thị trường) và làm tròn xuống hàng triệu
 */
export function calculateAssetValuationClient(params: {
  area?: number;
  actualArea?: number | null;
  valuationType?: ValuationType;
  fundLandCategory?: FundLandCategory | null;
  unitPrice?: number | null;
}): {
  effectiveArea: number;
  unitPrice: number;
  rawAmount: number;
  valuationAmount: number;
} {
  const baseArea = Number(params.area ?? 0);
  const actualArea =
    params.actualArea !== undefined &&
    params.actualArea !== null &&
    Number(params.actualArea) > 0
      ? Number(params.actualArea)
      : null;
  const effectiveArea = actualArea ?? baseArea;

  if (effectiveArea <= 0) {
    return {
      effectiveArea: 0,
      unitPrice: 0,
      rawAmount: 0,
      valuationAmount: 0,
    };
  }

  const resolvedUnitPrice =
    params.valuationType === 'QUY_DINH_QUY'
      ? params.fundLandCategory
        ? FUND_UNIT_PRICE_MAP[params.fundLandCategory] ?? 0
        : Number(params.unitPrice ?? 0)
      : Number(params.unitPrice ?? 0);

  const rawAmount = effectiveArea * resolvedUnitPrice;
  const valuationAmount = roundDownToMillion(rawAmount);

  return {
    effectiveArea,
    unitPrice: resolvedUnitPrice,
    rawAmount,
    valuationAmount,
  };
}

/**
 * Định dạng tiền tệ VNĐ
 */
export function formatVND(value?: number | string | null): string {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return '0 ₫';
  return `${num.toLocaleString('vi-VN')} ₫`;
}

/**
 * Định dạng ngày hiển thị dd/mm/yyyy
 */
export function formatDateDisplay(value?: string | Date | null): string {
  if (!value) return '—';
  if (typeof value === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return value;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Cộng số tháng vào ngày (trả về chuỗi dd/mm/yyyy)
 */
export function calculateDueDateDisplay(
  disbursementDateStr?: string | null,
  durationType?: LoanDurationType,
): string {
  if (!disbursementDateStr || !durationType) return '—';
  const months = durationType === 'NGAN_HAN' ? 12 : 24;

  let day: number;
  let month: number;
  let year: number;

  const dmyMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(
    disbursementDateStr.trim(),
  );
  if (dmyMatch) {
    day = Number.parseInt(dmyMatch[1], 10);
    month = Number.parseInt(dmyMatch[2], 10);
    year = Number.parseInt(dmyMatch[3], 10);
  } else {
    const parsed = new Date(disbursementDateStr);
    if (Number.isNaN(parsed.getTime())) return '—';
    day = parsed.getUTCDate();
    month = parsed.getUTCMonth() + 1;
    year = parsed.getUTCFullYear();
  }

  const targetMonthIndex = month - 1 + months;
  const result = new Date(Date.UTC(year, targetMonthIndex, day));
  if (result.getUTCDate() !== day) {
    const lastDay = new Date(Date.UTC(year, targetMonthIndex + 1, 0));
    return formatDateDisplay(lastDay);
  }
  return formatDateDisplay(result);
}
