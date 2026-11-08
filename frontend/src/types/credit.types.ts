export type IdentityCardType = 'CAN_CUOC' | 'CCCD';
export type Gender = 'NAM' | 'NU';
export type HeirRelationship = 'VO' | 'CHONG' | 'CON' | 'CHA' | 'ME';
export type RelatedPersonRelationship =
  | 'CON'
  | 'CHA'
  | 'ME'
  | 'ANH'
  | 'CHI'
  | 'EM'
  | 'CO'
  | 'DI'
  | 'CAU';
export type LoanType = 'TIN_CHAP' | 'THE_CHAP';
export type LoanDurationType = 'NGAN_HAN' | 'TRUNG_HAN';
export type LoanStatus =
  | 'DANG_CHUAN_BI_HO_SO'
  | 'DA_HOAN_THANH_HO_SO'
  | 'DA_GIAI_NGAN'
  | 'DA_TAT_TOAN'
  | 'QUA_HAN';
export type CollateralAssetType =
  | 'QSDD'
  | 'QSDD_NHA_O_TAI_SAN'
  | 'QSDD_TAI_SAN';
export type CertificateType =
  | 'GCN'
  | 'GIAY_CHUNG_NHAN'
  | 'VAO_SO_CAP_GCN_SO'
  | 'SO_VAO_SO_CAP_GCN';
export type CollateralOwnerType =
  | 'NGUOI_VAY_CA_NHAN'
  | 'NGUOI_VAY_HO'
  | 'NGUOI_THUA_KE_CA_NHAN'
  | 'NGUOI_THUA_KE_HO'
  | 'BAO_LANH';
export type ValuationType = 'QUY_DINH_QUY' | 'THI_TRUONG';
export type FundLandCategory =
  | 'DAT_BINH_THUONG'
  | 'DAT_CAP_KENH'
  | 'DAT_CAP_LO_DAT'
  | 'DAT_CAP_DUONG_NHUA';
export type LoanPlanItemType = 'CHI_PHI' | 'NGUON_THU';

export interface CreditOfficer {
  id: string;
  username: string;
  fullName: string;
  idType: IdentityCardType;
  idNumber: string;
  issuingAuthority: string;
  issueDate: string;
  gender: Gender;
  birthYear: number;
  createdAt?: string;
}

export interface TerritoryGroup {
  id: string;
  officerId: string;
  name: string;
  communes?: Commune[];
}

export interface Commune {
  id: string;
  officerId: string;
  territoryGroupId?: string | null;
  territoryGroup?: TerritoryGroup | null;
  name: string;
  province: string;
  fullAddress?: string;
  hamlets?: Hamlet[];
}

export interface Hamlet {
  id: string;
  officerId: string;
  communeId: string;
  commune?: Commune;
  name: string;
  fullAddress?: string;
}

export interface InterestRateTier {
  id: string;
  batchId?: string | null;
  loanType: LoanType;
  durationType: LoanDurationType;
  minAmount: string | number;
  maxAmount?: string | number | null;
  interestRate: string | number;
  description?: string | null;
  isActive: boolean;
}

export interface InterestRateBatch {
  id: string;
  effectiveDate: string;
  documentNote?: string | null;
  isApplied: boolean;
  tiers: InterestRateTier[];
  createdAt?: string;
}

export interface Heir {
  id?: string;
  fullName: string;
  idType: IdentityCardType;
  idNumber: string;
  issuingAuthority?: string;
  issueDate: string;
  expiryDate?: string | null;
  gender?: Gender;
  birthYear?: number;
  address: string;
  phone?: string | null;
  relationship: HeirRelationship;
}

export interface Borrower {
  id: string;
  officerId: string;
  hamletId: string;
  hamlet?: Hamlet;
  fullName: string;
  idType: IdentityCardType;
  idNumber: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate?: string | null;
  gender: Gender;
  birthYear: number;
  address: string;
  memberCode?: string | null;
  phone?: string | null;
  heir?: Heir | null;
  createdAt?: string;
}

export interface Guarantor {
  id?: string;
  fullName: string;
  idType: IdentityCardType;
  idNumber: string;
  issuingAuthority?: string;
  issueDate: string;
  expiryDate?: string | null;
  gender?: Gender;
  birthYear?: number;
  address: string;
}

export interface CollateralAsset {
  id?: string;
  hamletId?: string | null;
  hamlet?: Hamlet | null;
  communeId?: string | null;
  commune?: Commune | null;
  territorySelection?: string;
  assetType: CollateralAssetType;
  assetCode: string;
  certificateType: CertificateType;
  certificateNumber: string;
  plotNumber: string;
  mapSheetNumber: string;
  address?: string;
  area: number;
  usageForm?: string | null;
  usagePurpose?: string | null;
  usageTerm: string;
  usageOrigin?: string | null;
  usageRestriction?: string | null;
  ownerType: CollateralOwnerType;
  valuationType?: ValuationType | null;
  fundLandCategory?: FundLandCategory | null;
  unitPrice?: number | null;
  valuationAmount?: number | null;
  guarantor?: Guarantor | null;
}

export interface CollateralValuationItem {
  id?: string;
  plotNumber: string;
  mapSheetNumber: string;
  area: number;
  actualArea?: number | null;
  fundLandCategory?: FundLandCategory | null;
  unitPrice?: number | null;
  valuationAmount?: number;
  note?: string | null;
}

export interface RelatedPerson {
  id?: string;
  fullName: string;
  idType: IdentityCardType;
  idNumber: string;
  issuingAuthority?: string;
  issueDate: string;
  expiryDate?: string | null;
  gender?: Gender;
  birthYear?: number;
  address: string;
  phone?: string | null;
  relationship: RelatedPersonRelationship;
  existingLoanAtFund?: number | null;
}

export interface HouseholdMember {
  id?: string;
  fullName: string;
  idType: IdentityCardType;
  idNumber: string;
  issuingAuthority?: string;
  issueDate: string;
  expiryDate?: string | null;
  gender?: Gender;
  birthYear?: number;
  address: string;
  phone?: string | null;
}

export interface LoanPlanItem {
  id?: string;
  type?: LoanPlanItemType;
  itemName: string;
  amount: number;
}

export interface LoanPlan {
  id?: string;
  loanPurpose: string;
  totalCapitalNeed?: number;
  fundLoanCapital?: number;
  ownCapital?: number;
  totalRevenue?: number;
  profit?: number;
  items?: LoanPlanItem[];
}

export interface Loan {
  id: string;
  officerId: string;
  borrowerId: string;
  borrower: Borrower;
  loanDate: string;
  disbursementDate?: string | null;
  loanAmount: string | number;
  indentureNumber?: string | null;
  loanType: LoanType;
  durationType: LoanDurationType;
  durationMonths: number;
  interestRate: string | number;
  dueDate?: string | null;
  status: LoanStatus;
  mortgageContractNumber?: string | null;
  committeeNotarizationDate?: string | null;
  mortgageContractTermDate?: string | null;
  valuationDate?: string | null;
  valuationType?: ValuationType | null;
  totalCollateralValuation?: string | number | null;
  maxAllowedLoanAmount?: string | number | null;
  collateralAssets?: CollateralAsset[];
  valuationItems?: CollateralValuationItem[];
  relatedPersons?: RelatedPerson[];
  householdMembers?: HouseholdMember[];
  loanPlan?: LoanPlan | null;
  createdAt: string;
}

export interface DashboardSummary {
  totalLoans: number;
  totalBorrowers: number;
  totalGroups: number;
  totalCommunes: number;
  totalHamlets: number;
  totalLoanAmount: number;
  totalCollateralValuation: number;
  byLoanType: Array<{ loanType: LoanType; count: number; amount: number }>;
  byDurationType: Array<{
    durationType: LoanDurationType;
    count: number;
    amount: number;
  }>;
  recentLoans: Loan[];
}
