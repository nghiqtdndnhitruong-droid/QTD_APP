import {
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import {
  CollateralAssetType,
  CollateralOwnerType,
  CertificateType,
  FundLandCategory,
  IdentityCardType,
  LoanDurationType,
  LoanStatus,
  LoanType,
  ValuationType,
} from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoansService } from './loans.service.js';
import type { CreateLoanDto } from './dto/create-loan.dto.js';
import type { UpdateLoanDto } from './dto/update-loan.dto.js';
import type { PrismaService } from '../../prisma/prisma.service.js';
import type { BorrowersService } from '../borrowers/borrowers.service.js';
import type { InterestRatesService } from '../interest-rates/interest-rates.service.js';
import type { TerritoriesService } from '../territories/territories.service.js';

const OFFICER_ID = 'officer-1';

function makeAssetDto(overrides: Partial<any> = {}) {
  return {
    assetType: CollateralAssetType.QSDD,
    assetCode: 'TS-001',
    certificateType: CertificateType.GCN,
    certificateNumber: 'GCN-123',
    plotNumber: '01',
    mapSheetNumber: '02',
    hamletId: 'hamlet-1',
    communeId: null,
    area: 500,
    usageTerm: 'Lâu dài',
    ownerType: CollateralOwnerType.NGUOI_VAY_CA_NHAN,
    ...overrides,
  };
}

function makeLoanPlanDto(overrides: Partial<any> = {}) {
  return {
    loanPurpose: 'Sửa nhà',
    totalCapitalNeed: 50_000_000,
    expenses: [{ itemName: 'Vật liệu', amount: 30_000_000 }],
    revenues: [{ itemName: 'Bán lúa', amount: 60_000_000 }],
    ...overrides,
  };
}

function makeCreateLoanDto(overrides: Partial<CreateLoanDto> = {}): CreateLoanDto {
  return {
    borrowerId: 'borrower-1',
    loanDate: '01/01/2026',
    loanAmount: 50_000_000,
    loanType: LoanType.TIN_CHAP,
    durationType: LoanDurationType.NGAN_HAN,
    collateralAssets: [makeAssetDto()],
    loanPlan: makeLoanPlanDto(),
    ...overrides,
  } as CreateLoanDto;
}

function makeExistingLoan(overrides: Partial<any> = {}) {
  const identity = {
    fullName: 'Nguyễn Văn A',
    idType: IdentityCardType.CCCD,
    idNumber: '084206123456',
    issueDate: new Date('2020-01-01T00:00:00.000Z'),
    expiryDate: new Date('2030-01-01T00:00:00.000Z'),
  };

  return {
    id: 'loan-1',
    officerId: OFFICER_ID,
    borrowerId: 'borrower-1',
    borrower: { heir: null },
    loanDate: new Date('2026-01-01T00:00:00.000Z'),
    disbursementDate: new Date('2026-01-01T00:00:00.000Z'),
    loanAmount: 50_000_000,
    indentureNumber: null,
    loanType: LoanType.TIN_CHAP,
    durationType: LoanDurationType.NGAN_HAN,
    interestRate: 6,
    status: LoanStatus.DA_GIAI_NGAN,
    mortgageContractNumber: null,
    committeeNotarizationDate: null,
    mortgageContractTermDate: null,
    valuationDate: null,
    valuationType: null,
    totalCollateralValuation: null,
    maxAllowedLoanAmount: 100_000_000,
    collateralAssets: [
      {
        assetType: CollateralAssetType.QSDD,
        assetCode: 'TS-001',
        certificateType: CertificateType.GCN,
        certificateNumber: 'GCN-123',
        plotNumber: '01',
        mapSheetNumber: '02',
        hamletId: 'hamlet-1',
        communeId: null,
        area: 500,
        usageForm: null,
        usagePurpose: null,
        usageTerm: 'Lâu dài',
        usageOrigin: null,
        usageRestriction: null,
        ownerType: CollateralOwnerType.NGUOI_VAY_CA_NHAN,
        valuationType: null,
        fundLandCategory: null,
        unitPrice: null,
        guarantor: null,
      },
    ],
    valuationItems: [],
    relatedPersons: [],
    householdMembers: [],
    loanPlan: { id: 'plan-1' },
    ...overrides,
  };
}

describe('LoansService', () => {
  let service: LoansService;
  let prisma: any;
  let borrowersService: any;
  let interestRatesService: any;
  let territoriesService: any;

  beforeEach(() => {
    prisma = {
      borrower: {
        findFirst: vi.fn().mockResolvedValue({ id: 'borrower-1', heir: null }),
        create: vi.fn().mockResolvedValue({ id: 'borrower-new' }),
      },
      loan: {
        findUnique: vi.fn().mockResolvedValue(null),
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 'loan-new' }),
        update: vi.fn().mockResolvedValue({ id: 'loan-1' }),
      },
      $transaction: vi.fn(async (fn: any) => fn(prisma)),
    };
    borrowersService = {
      assertIdNumberUnique: vi.fn().mockResolvedValue(undefined),
      buildCreateBorrowerInput: vi.fn().mockResolvedValue({ fullName: 'X' }),
    };
    interestRatesService = {
      resolveInterestRate: vi.fn().mockResolvedValue(6),
      lookupRate: vi.fn().mockResolvedValue(null),
    };
    territoriesService = {
      resolveMultipleHamletsForOfficer: vi
        .fn()
        .mockResolvedValue(new Map([['hamlet-1', 'Ấp 1, Xã A']])),
      resolveMultipleCommunesForOfficer: vi
        .fn()
        .mockResolvedValue(new Map([['commune-1', 'Xã A']])),
    };

    service = new LoansService(
      prisma as PrismaService,
      borrowersService as BorrowersService,
      interestRatesService as InterestRatesService,
      territoriesService as TerritoriesService,
    );
  });

  describe('create()', () => {
    it('Tín chấp quá hạn mức 100 triệu -> BadRequest', async () => {
      await expect(
        service.create(OFFICER_ID, makeCreateLoanDto({ loanAmount: 150_000_000 })),
      ).rejects.toThrow(BadRequestException);
    });

    it('Thế chấp thiếu Số khế ước -> BadRequest', async () => {
      await expect(
        service.create(
          OFFICER_ID,
          makeCreateLoanDto({
            loanType: LoanType.THE_CHAP,
            indentureNumber: null,
            mortgageContractNumber: 'HĐTC-01',
            valuationItems: [
              {
                plotNumber: '01',
                mapSheetNumber: '02',
                area: 500,
                actualArea: null,
                fundLandCategory: FundLandCategory.DAT_BINH_THUONG,
                unitPrice: null,
                note: null,
              },
            ],
            valuationType: ValuationType.QUY_DINH_QUY,
          }),
        ),
      ).rejects.toThrow('Khoản vay Thế chấp bắt buộc phải có Số khế ước');
    });

    it('Số khế ước trùng -> ConflictException', async () => {
      prisma.loan.findUnique.mockResolvedValue({
        id: 'loan-other',
        indentureNumber: 'KC-001',
      });

      await expect(
        service.create(
          OFFICER_ID,
          makeCreateLoanDto({ indentureNumber: 'KC-001' }),
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('Thế chấp >= 140 triệu thiếu Người liên quan -> BadRequest', async () => {
      const asset = makeAssetDto({ area: 2_000 });
      await expect(
        service.create(
          OFFICER_ID,
          makeCreateLoanDto({
            loanType: LoanType.THE_CHAP,
            loanAmount: 140_000_000,
            indentureNumber: 'KC-002',
            mortgageContractNumber: 'HĐTC-02',
            collateralAssets: [asset],
            valuationType: ValuationType.QUY_DINH_QUY,
            valuationItems: [
              {
                plotNumber: '01',
                mapSheetNumber: '02',
                area: 2_000,
                actualArea: null,
                fundLandCategory: FundLandCategory.DAT_CAP_DUONG_NHUA,
                unitPrice: null,
                note: null,
              },
            ],
            relatedPersons: [],
          }),
        ),
      ).rejects.toThrow('bắt buộc phải nhập ít nhất 1 Người liên quan');
    });

    it('Thế chấp < 140 triệu không cần Người liên quan -> tạo thành công', async () => {
      await service.create(
        OFFICER_ID,
        makeCreateLoanDto({
          loanType: LoanType.THE_CHAP,
          loanAmount: 100_000_000,
          indentureNumber: 'KC-003',
          mortgageContractNumber: 'HĐTC-03',
          valuationType: ValuationType.QUY_DINH_QUY,
          loanPlan: makeLoanPlanDto({ totalCapitalNeed: 120_000_000 }),
          valuationItems: [
            {
              plotNumber: '01',
              mapSheetNumber: '02',
              area: 2_000,
              actualArea: null,
              fundLandCategory: FundLandCategory.DAT_CAP_DUONG_NHUA,
              unitPrice: null,
              note: null,
            },
          ],
        }),
      );

      expect(prisma.loan.create).toHaveBeenCalledOnce();
    });
  });

  describe('update()', () => {
    it('Đổi status sang DA_GIAI_NGAN không kèm ngày -> tự lấy hôm nay (UTC nửa đêm)', async () => {
      prisma.loan.findFirst.mockResolvedValue(
        makeExistingLoan({
          status: LoanStatus.DANG_CHUAN_BI_HO_SO,
          disbursementDate: null,
        }),
      );

      await service.update(OFFICER_ID, 'loan-1', { status: LoanStatus.DA_GIAI_NGAN });

      const dataArg = prisma.loan.update.mock.calls[0][0].data;
      expect(dataArg.disbursementDate).not.toBeNull();
      expect(dataArg.disbursementDate.getUTCHours()).toBe(0);
      expect(dataArg.disbursementDate.getUTCMinutes()).toBe(0);
      expect(dataArg.durationMonths).toBe(12);
      expect(dataArg.dueDate).not.toBeNull();
    });

    it('Chỉ đổi 1 trường (loanAmount) -> không xóa các quan hệ khác', async () => {
      prisma.loan.findFirst.mockResolvedValue(makeExistingLoan());

      await service.update(OFFICER_ID, 'loan-1', { loanAmount: 60_000_000 });

      const dataArg = prisma.loan.update.mock.calls[0][0].data;
      // loanAmount thay đổi -> chạy lại validate, nhưng TIN_CHAP giữ nguyên nên
      // vẫn thay-toàn-bộ các quan hệ rỗng của Tín chấp. Quan trọng: KHÔNG mất
      // collateralAssets đã có sẵn (nó được map lại từ DB và tạo lại).
      expect(dataArg.collateralAssets).toBeDefined();
      expect(dataArg.collateralAssets.create).toHaveLength(1);
      expect(dataArg.collateralAssets.create[0].assetCode).toBe('TS-001');
      // loanDate giữ nguyên từ DB
      expect(dataArg.loanDate).toEqual(new Date('2026-01-01T00:00:00.000Z'));
    });

    it('Chuyển TIN_CHAP -> THE_CHAP thiếu khế ước -> BadRequest', async () => {
      prisma.loan.findFirst.mockResolvedValue(makeExistingLoan());

      await expect(
        service.update(OFFICER_ID, 'loan-1', {
          loanType: LoanType.THE_CHAP,
          collateralAssets: [makeAssetDto({ area: 500 })],
        }),
      ).rejects.toThrow('Khoản vay Thế chấp bắt buộc phải có Số khế ước');
    });

    it('Chuyển TIN_CHAP -> THE_CHAP đầy đủ -> xóa và tạo lại valuationItems', async () => {
      prisma.loan.findFirst.mockResolvedValue(makeExistingLoan());

      await service.update(OFFICER_ID, 'loan-1', {
        loanType: LoanType.THE_CHAP,
        indentureNumber: 'KC-010',
        mortgageContractNumber: 'HĐTC-010',
        valuationType: ValuationType.QUY_DINH_QUY,
        collateralAssets: [makeAssetDto({ area: 2_000 })],
        valuationItems: [
          {
            plotNumber: '01',
            mapSheetNumber: '02',
            area: 2_000,
            actualArea: null,
            fundLandCategory: FundLandCategory.DAT_CAP_DUONG_NHUA,
            unitPrice: null,
            note: null,
          },
        ],
      });

      const dataArg = prisma.loan.update.mock.calls[0][0].data;
      expect(dataArg.loanType).toBe(LoanType.THE_CHAP);
      expect(dataArg.valuationItems.deleteMany).toEqual({});
      expect(dataArg.valuationItems.create).toHaveLength(1);
      // THE_CHAP + dto không gửi relatedPersons -> không đụng tới quan hệ này
      expect(dataArg.relatedPersons).toBeUndefined();
    });

    it('Roundtrip create -> update không mất dữ liệu người liên quan', async () => {
      const existing = makeExistingLoan({
        loanType: LoanType.THE_CHAP,
        indentureNumber: 'KC-020',
        mortgageContractNumber: 'HĐTC-020',
        valuationType: ValuationType.QUY_DINH_QUY,
        totalCollateralValuation: 30_000_000,
        maxAllowedLoanAmount: 21_000_000,
        relatedPersons: [
          {
            ...{
              fullName: 'Trần Thị B',
              idType: IdentityCardType.CAN_CUOC,
              idNumber: '084206123457',
              issueDate: new Date('2021-06-15T00:00:00.000Z'),
              expiryDate: null,
            },
            address: 'Ấp 1, Xã A',
            phone: '0901234567',
            relationship: 'VO',
            existingLoanAtFund: null,
          },
        ],
        collateralAssets: [
          {
            ...makeExistingLoan().collateralAssets[0],
            valuationType: ValuationType.QUY_DINH_QUY,
            fundLandCategory: FundLandCategory.DAT_BINH_THUONG,
            unitPrice: 60_000,
          },
        ],
        valuationItems: [
          {
            plotNumber: '01',
            mapSheetNumber: '02',
            area: 500,
            actualArea: null,
            fundLandCategory: FundLandCategory.DAT_BINH_THUONG,
            unitPrice: 60_000,
            note: null,
          },
        ],
      });

      prisma.loan.findFirst.mockResolvedValue(existing);

      // Chỉ đổi 1 trường không liên quan (loanDate), các quan hệ phải được map lại từ DB
      // (relatedPersons chỉ được thay-toàn-bộ khi client gửi lại hoặc chuyển về tín chấp,
      // nên ở đây ta gửi lại mảng rỗng để test map lại từ DB) — dùng collateralAssets
      // không gửi lại nhưng dto.collateralAssets undefined + nextLoanType THE_CHAP
      // nên relatedPersons giữ nguyên, nhưng valuationItems/collateralAssets được map lại.
      await service.update(OFFICER_ID, 'loan-1', {
        loanDate: '02/01/2026',
        collateralAssets: [
          makeAssetDto({ area: 2_000, valuationType: ValuationType.QUY_DINH_QUY, fundLandCategory: FundLandCategory.DAT_BINH_THUONG }),
        ],
        valuationItems: [
          {
            plotNumber: '01',
            mapSheetNumber: '02',
            area: 2_000,
            actualArea: null,
            fundLandCategory: FundLandCategory.DAT_BINH_THUONG,
            unitPrice: null,
            note: null,
          },
        ],
      });

      const dataArg = prisma.loan.update.mock.calls[0][0].data;
      expect(dataArg.relatedPersons).toBeUndefined();
      expect(dataArg.valuationItems.create).toHaveLength(1);
      expect(dataArg.collateralAssets.create).toHaveLength(1);
    });
  });
});
