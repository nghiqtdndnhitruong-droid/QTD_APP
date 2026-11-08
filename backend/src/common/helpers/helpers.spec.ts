import {
  FundLandCategory,
  Gender,
  IdentityCardType,
  LoanDurationType,
  LoanType,
  ValuationType,
} from '@prisma/client';
import { describe, expect, it } from 'vitest';
import {
  buildPersonIdentityFields,
  calculateCollateralAssetValuation,
  calculateLoanPlanSummary,
  calculateLoanTermAndDueDate,
  calculateMaxLoanLimit,
  formatDateDDMMYYYY,
  formatTerritoryAddress,
  hashPassword,
  parseIdentityCardNumber,
  roundDownToMillion,
  verifyPassword,
} from './index.js';

describe('Shared Helpers', () => {
  describe('parseIdentityCardNumber & buildPersonIdentityFields', () => {
    it('extracts NAM & 1984 from 084084xxxxxx (digit 4 = 0, digits 5-6 = 84)', () => {
      const res = parseIdentityCardNumber('084084123456');
      expect(res.gender).toBe(Gender.NAM);
      expect(res.birthYear).toBe(1984);
    });

    it('extracts NU & 1995 from 084195xxxxxx (digit 4 = 1, digits 5-6 = 95)', () => {
      const res = parseIdentityCardNumber('084195123456');
      expect(res.gender).toBe(Gender.NU);
      expect(res.birthYear).toBe(1995);
    });

    it('extracts NAM & 2006 from 084206xxxxxx (digit 4 = 2, digits 5-6 = 06)', () => {
      const res = parseIdentityCardNumber('084206123456');
      expect(res.gender).toBe(Gender.NAM);
      expect(res.birthYear).toBe(2006);
    });

    it('extracts NU & 2003 from 084303xxxxxx (digit 4 = 3, digits 5-6 = 03)', () => {
      const res = parseIdentityCardNumber('084303123456');
      expect(res.gender).toBe(Gender.NU);
      expect(res.birthYear).toBe(2003);
    });

    it('resolves issuing authority automatically by IdentityCardType', () => {
      const canCuoc = buildPersonIdentityFields({
        idType: IdentityCardType.CAN_CUOC,
        idNumber: '084084123456',
        issueDate: '15/05/2024',
      });
      expect(canCuoc.issuingAuthority).toBe('Bộ Công An');

      const cccd = buildPersonIdentityFields({
        idType: IdentityCardType.CCCD,
        idNumber: '084190123456',
        issueDate: '15/05/2022',
      });
      expect(cccd.issuingAuthority).toBe('Cục CSQLHC về TTXH');
    });
  });

  describe('Valuation & Loan Limit Helpers', () => {
    it('rounds down valuation to nearest million (15.200.000 -> 15.000.000)', () => {
      expect(roundDownToMillion(15_200_000)).toBe(15_000_000);
      expect(roundDownToMillion(15_999_999)).toBe(15_000_000);
    });

    it('calculates fund regulation valuation and rounds down to million', () => {
      const res = calculateCollateralAssetValuation({
        area: 253.33, // 253.33 * 60,000 = 15,199,800 -> 15,000,000
        valuationType: ValuationType.QUY_DINH_QUY,
        fundLandCategory: FundLandCategory.DAT_BINH_THUONG,
      });
      expect(res.unitPrice).toBe(60_000);
      expect(res.valuationAmount).toBe(15_000_000);
    });

    it('calculates max loan limit (100M for TIN_CHAP, 70% for THE_CHAP)', () => {
      expect(calculateMaxLoanLimit(LoanType.TIN_CHAP)).toBe(100_000_000);
      expect(calculateMaxLoanLimit(LoanType.THE_CHAP, 300_000_000)).toBe(
        210_000_000,
      );
    });
  });

  describe('Date & Loan Plan Helpers', () => {
    it('calculates 12 months and 24 months due dates from disbursementDate', () => {
      const shortTerm = calculateLoanTermAndDueDate(
        '08/11/2026',
        LoanDurationType.NGAN_HAN,
      );
      expect(shortTerm.durationMonths).toBe(12);
      expect(formatDateDDMMYYYY(shortTerm.dueDate)).toBe('08/11/2027');

      const mediumTerm = calculateLoanTermAndDueDate(
        '08/11/2026',
        LoanDurationType.TRUNG_HAN,
      );
      expect(mediumTerm.durationMonths).toBe(24);
      expect(formatDateDDMMYYYY(mediumTerm.dueDate)).toBe('08/11/2028');
    });

    it('calculates loan plan summary accurately', () => {
      const plan = calculateLoanPlanSummary({
        expenses: [
          { itemName: 'Mua giống và phân bón', amount: 120_000_000 },
          { itemName: 'Tiền lãi vay', amount: 12_000_000 },
        ],
        revenues: [{ itemName: 'Thu hoạch lúa', amount: 200_000_000 }],
        fundLoanCapital: 100_000_000,
      });
      expect(plan.totalCapitalNeed).toBe(132_000_000);
      expect(plan.ownCapital).toBe(32_000_000);
      expect(plan.totalRevenue).toBe(200_000_000);
      expect(plan.profit).toBe(68_000_000);
    });
  });

  describe('Territory & Password Helpers', () => {
    it('formats territory address as "Ấp ..., Xã ..., Tỉnh Vĩnh Long"', () => {
      expect(formatTerritoryAddress('Ấp Nô Lựa', 'Xã Nhị Trường')).toBe(
        'Ấp Nô Lựa, Xã Nhị Trường, Tỉnh Vĩnh Long',
      );
      expect(formatTerritoryAddress('Nô Lựa', 'Nhị Trường')).toBe(
        'Ấp Nô Lựa, Xã Nhị Trường, Tỉnh Vĩnh Long',
      );
    });

    it('hashes and verifies passwords accurately', () => {
      const hash = hashPassword('MatKhau@123');
      expect(verifyPassword('MatKhau@123', hash)).toBe(true);
      expect(verifyPassword('SaiMatKhau', hash)).toBe(false);
    });
  });
});
