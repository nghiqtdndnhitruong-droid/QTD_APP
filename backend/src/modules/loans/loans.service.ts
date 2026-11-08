import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CollateralOwnerType,
  LoanPlanItemType,
  LoanStatus,
  LoanType,
  Prisma,
  ValuationType,
} from '@prisma/client';
import {
  HOUSEHOLD_OWNER_TYPES,
  RELATED_PERSON_MANDATORY_THRESHOLD,
} from '../../common/constants/loan.constants.js';
import {
  buildPersonIdentityFields,
  calculateCollateralAssetValuation,
  calculateLoanPlanSummary,
  calculateLoanTermAndDueDate,
  calculateMaxLoanLimit,
  formatDateDDMMYYYY,
  parseDateInput,
} from '../../common/helpers/index.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { BorrowersService } from '../borrowers/borrowers.service.js';
import { InterestRatesService } from '../interest-rates/interest-rates.service.js';
import { TerritoriesService } from '../territories/territories.service.js';
import {
  CreateCollateralAssetDto,
  CreateCollateralValuationItemDto,
  CreateHouseholdMemberDto,
  CreateLoanDto,
  CreateLoanPlanDto,
  CreateRelatedPersonDto,
} from './dto/create-loan.dto.js';
import {
  PreviewLoanCalculationDto,
  QueryLoanDto,
  UpdateLoanDto,
} from './dto/update-loan.dto.js';

const LOAN_FULL_INCLUDE = {
  borrower: {
    include: {
      heir: true,
      hamlet: {
        include: {
          commune: {
            include: {
              territoryGroup: true,
            },
          },
        },
      },
    },
  },
  collateralAssets: {
    include: {
      guarantor: true,
      hamlet: {
        include: {
          commune: {
            include: {
              territoryGroup: true,
            },
          },
        },
      },
      commune: {
        include: {
          territoryGroup: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
  valuationItems: {
    orderBy: { sortOrder: 'asc' as const },
  },
  relatedPersons: {
    orderBy: { createdAt: 'asc' as const },
  },
  householdMembers: {
    orderBy: { createdAt: 'asc' as const },
  },
  loanPlan: {
    include: {
      items: {
        orderBy: { sortOrder: 'asc' as const },
      },
    },
  },
} satisfies Prisma.LoanInclude;

@Injectable()
export class LoansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly borrowersService: BorrowersService,
    private readonly interestRatesService: InterestRatesService,
    private readonly territoriesService: TerritoriesService,
  ) {}

  private async assertIndentureUnique(
    indentureNumber: string | null | undefined,
    excludeLoanId?: string,
  ): Promise<void> {
    const trimmed = indentureNumber?.trim();
    if (!trimmed) {
      return;
    }

    const existing = await this.prisma.loan.findUnique({
      where: { indentureNumber: trimmed },
      select: { id: true, indentureNumber: true },
    });

    if (existing && existing.id !== excludeLoanId) {
      throw new ConflictException(
        `Số khế ước "${existing.indentureNumber}" đã tồn tại trong hệ thống`,
      );
    }
  }

  /**
   * Chuẩn hóa và kiểm tra danh sách Tài sản bảo đảm (dùng cho cả Tín chấp và Thế chấp):
   * - Tự động lấy địa chỉ thửa đất từ danh sách địa bàn cấp Ấp (hamletId) hoặc cấp Xã (communeId)
   * - Các trường hình thức sử dụng, mục đích sử dụng, nguồn gốc sử dụng, hạn chế sử dụng là tùy chọn
   */
  private async prepareCollateralAssets(
    officerId: string,
    assetsDto: CreateCollateralAssetDto[],
    hasHeir: boolean,
  ): Promise<{
    hasHouseholdAsset: boolean;
    assetsCreateInput: Prisma.CollateralAssetUncheckedCreateWithoutLoanInput[];
  }> {
    const hamletIds = assetsDto
      .map((a) => a.hamletId?.trim())
      .filter((id): id is string => Boolean(id));
    const communeIds = assetsDto
      .map((a) => a.communeId?.trim())
      .filter((id): id is string => Boolean(id));

    const [hamletAddressMap, communeAddressMap] = await Promise.all([
      this.territoriesService.resolveMultipleHamletsForOfficer(
        officerId,
        hamletIds,
      ),
      this.territoriesService.resolveMultipleCommunesForOfficer(
        officerId,
        communeIds,
      ),
    ]);

    let hasHouseholdAsset = false;

    const assetsCreateInput: Prisma.CollateralAssetUncheckedCreateWithoutLoanInput[] =
      assetsDto.map((asset, index) => {
        const assetLabel = `Tài sản bảo đảm #${index + 1} (${asset.assetCode})`;
        const hamletId = asset.hamletId?.trim() || null;
        const communeId = asset.communeId?.trim() || null;

        let formattedAddress: string | undefined;
        if (hamletId) {
          formattedAddress = hamletAddressMap.get(hamletId);
        } else if (communeId) {
          formattedAddress = communeAddressMap.get(communeId);
        }

        if (!formattedAddress) {
          throw new BadRequestException(
            `Vui lòng chọn địa bàn (cấp Ấp hoặc cấp Xã) hợp lệ cho ${assetLabel}`,
          );
        }

        if (
          (asset.ownerType === CollateralOwnerType.NGUOI_THUA_KE_CA_NHAN ||
            asset.ownerType === CollateralOwnerType.NGUOI_THUA_KE_HO) &&
          !hasHeir
        ) {
          throw new BadRequestException(
            `${assetLabel} có chủ sở hữu là Người thừa kế nhưng hồ sơ người vay chưa có thông tin Người thừa kế`,
          );
        }

        if (HOUSEHOLD_OWNER_TYPES.has(asset.ownerType)) {
          hasHouseholdAsset = true;
        }

        let guarantorCreate:
          | Prisma.GuarantorUncheckedCreateNestedOneWithoutCollateralAssetInput
          | undefined;

        if (asset.ownerType === CollateralOwnerType.BAO_LANH) {
          if (!asset.guarantor) {
            throw new BadRequestException(
              `${assetLabel} có chủ sở hữu là Bảo lãnh nên bắt buộc phải nhập thông tin của 1 Người bảo lãnh`,
            );
          }
          const guarantorIdentity = buildPersonIdentityFields(
            asset.guarantor,
            `người bảo lãnh của ${assetLabel}`,
          );
          guarantorCreate = {
            create: {
              fullName: asset.guarantor.fullName.trim(),
              idType: guarantorIdentity.idType,
              idNumber: guarantorIdentity.idNumber,
              issuingAuthority: guarantorIdentity.issuingAuthority,
              issueDate: guarantorIdentity.issueDate,
              expiryDate: guarantorIdentity.expiryDate,
              gender: guarantorIdentity.gender,
              birthYear: guarantorIdentity.birthYear,
              address: asset.guarantor.address.trim(),
            },
          };
        }

        return {
          hamletId,
          communeId: hamletId ? null : communeId,
          assetType: asset.assetType,
          assetCode: asset.assetCode.trim(),
          certificateType: asset.certificateType,
          certificateNumber: asset.certificateNumber.trim(),
          plotNumber: asset.plotNumber.trim(),
          mapSheetNumber: asset.mapSheetNumber.trim(),
          address: formattedAddress,
          area: asset.area,
          usageForm: asset.usageForm?.trim() || null,
          usagePurpose: asset.usagePurpose?.trim() || null,
          usageTerm: asset.usageTerm.trim(),
          usageOrigin: asset.usageOrigin?.trim() || null,
          usageRestriction: asset.usageRestriction?.trim() || null,
          ownerType: asset.ownerType,
          valuationType: asset.valuationType ?? null,
          fundLandCategory: asset.fundLandCategory ?? null,
          unitPrice: asset.unitPrice ?? null,
          valuationAmount: null,
          ...(guarantorCreate ? { guarantor: guarantorCreate } : {}),
        };
      });

    return {
      hasHouseholdAsset,
      assetsCreateInput,
    };
  }

  /**
   * Chuẩn hóa Bảng Định giá Tài sản Thế chấp (Section riêng khi vay Thế chấp):
   * - Lấy diện tích thực tế định giá (actualArea) nếu có nhập, ngược lại lấy diện tích (area) nhân với đơn giá
   * - Làm tròn xuống hàng triệu
   */
  private prepareValuationItems(
    valuationType: ValuationType,
    valuationItemsDto: CreateCollateralValuationItemDto[],
    fallbackAssetsDto: CreateCollateralAssetDto[],
  ): {
    totalValuation: number;
    valuationItemsCreateInput: Prisma.CollateralValuationItemCreateWithoutLoanInput[];
  } {
    const effectiveItems: CreateCollateralValuationItemDto[] =
      valuationItemsDto.length > 0
        ? valuationItemsDto
        : fallbackAssetsDto.map((a) => ({
            plotNumber: a.plotNumber,
            mapSheetNumber: a.mapSheetNumber,
            area: a.area,
            actualArea: null,
            fundLandCategory: a.fundLandCategory ?? null,
            unitPrice: a.unitPrice ?? null,
            note: null,
          }));

    if (effectiveItems.length === 0) {
      throw new BadRequestException(
        'Khoản vay Thế chấp bắt buộc phải có ít nhất 1 dòng trong bảng Định giá tài sản',
      );
    }

    let totalValuation = 0;

    const valuationItemsCreateInput: Prisma.CollateralValuationItemCreateWithoutLoanInput[] =
      effectiveItems.map((item, idx) => {
        const calc = calculateCollateralAssetValuation({
          area: item.area,
          actualArea: item.actualArea,
          valuationType,
          fundLandCategory: item.fundLandCategory,
          unitPrice: item.unitPrice,
        });

        totalValuation += calc.valuationAmount;

        return {
          plotNumber: item.plotNumber.trim(),
          mapSheetNumber: item.mapSheetNumber.trim(),
          area: item.area,
          actualArea:
            item.actualArea !== undefined &&
            item.actualArea !== null &&
            item.actualArea > 0
              ? item.actualArea
              : null,
          fundLandCategory:
            valuationType === ValuationType.QUY_DINH_QUY
              ? (item.fundLandCategory ?? null)
              : null,
          unitPrice: calc.unitPrice,
          valuationAmount: calc.valuationAmount,
          note: item.note?.trim() || null,
          sortOrder: idx + 1,
        };
      });

    return {
      totalValuation,
      valuationItemsCreateInput,
    };
  }

  private prepareRelatedPersons(
    personsDto: CreateRelatedPersonDto[],
  ): Prisma.RelatedPersonCreateWithoutLoanInput[] {
    return personsDto.map((person, index) => {
      const identity = buildPersonIdentityFields(
        person,
        `người liên quan #${index + 1}`,
      );
      return {
        fullName: person.fullName.trim(),
        idType: identity.idType,
        idNumber: identity.idNumber,
        issuingAuthority: identity.issuingAuthority,
        issueDate: identity.issueDate,
        expiryDate: identity.expiryDate,
        gender: identity.gender,
        birthYear: identity.birthYear,
        address: person.address.trim(),
        phone: person.phone?.trim() || null,
        relationship: person.relationship,
        existingLoanAtFund:
          person.existingLoanAtFund !== undefined &&
          person.existingLoanAtFund !== null &&
          person.existingLoanAtFund > 0
            ? person.existingLoanAtFund
            : null,
      };
    });
  }

  private prepareHouseholdMembers(
    membersDto: CreateHouseholdMemberDto[],
  ): Prisma.HouseholdMemberCreateWithoutLoanInput[] {
    return membersDto.map((member, index) => {
      const identity = buildPersonIdentityFields(
        member,
        `người trong hộ #${index + 1}`,
      );
      return {
        fullName: member.fullName.trim(),
        idType: identity.idType,
        idNumber: identity.idNumber,
        issuingAuthority: identity.issuingAuthority,
        issueDate: identity.issueDate,
        expiryDate: identity.expiryDate,
        gender: identity.gender,
        birthYear: identity.birthYear,
        address: member.address.trim(),
        phone: member.phone?.trim() || null,
      };
    });
  }

  private prepareLoanPlan(
    planDto: CreateLoanPlanDto,
    loanAmount: number,
  ): Prisma.LoanPlanCreateWithoutLoanInput {
    const fundLoanCapital = planDto.fundLoanCapital ?? loanAmount;
    const summary = calculateLoanPlanSummary({
      totalCapitalNeed: planDto.totalCapitalNeed,
      expenses: planDto.expenses,
      revenues: planDto.revenues,
      fundLoanCapital,
    });

    const items: Prisma.LoanPlanItemCreateWithoutLoanPlanInput[] = [
      ...planDto.expenses.map((item, idx) => ({
        type: LoanPlanItemType.CHI_PHI,
        itemName: item.itemName.trim(),
        amount: item.amount,
        sortOrder: idx + 1,
      })),
      ...planDto.revenues.map((item, idx) => ({
        type: LoanPlanItemType.NGUON_THU,
        itemName: item.itemName.trim(),
        amount: item.amount,
        sortOrder: idx + 1,
      })),
    ];

    return {
      loanPurpose: planDto.loanPurpose.trim(),
      totalCapitalNeed: summary.totalCapitalNeed,
      fundLoanCapital: summary.fundLoanCapital,
      ownCapital: summary.ownCapital,
      totalRevenue: summary.totalRevenue,
      profit: summary.profit,
      items: {
        create: items,
      },
    };
  }

  private async validateAndBuildLoanRelations(params: {
    officerId: string;
    loanType: LoanType;
    loanAmount: number;
    loanDate: Date;
    indentureNumber?: string | null;
    mortgageContractNumber?: string | null;
    committeeNotarizationDate?: string | null;
    mortgageContractTermDate?: string | null;
    valuationDate?: string | null;
    valuationType?: ValuationType | null;
    collateralAssets?: CreateCollateralAssetDto[];
    valuationItems?: CreateCollateralValuationItemDto[];
    relatedPersons?: CreateRelatedPersonDto[];
    householdMembers?: CreateHouseholdMemberDto[];
    hasHeir: boolean;
  }) {
    const {
      officerId,
      loanType,
      loanAmount,
      loanDate,
      indentureNumber,
      mortgageContractNumber,
      committeeNotarizationDate,
      mortgageContractTermDate,
      valuationDate,
      valuationType,
      collateralAssets = [],
      valuationItems = [],
      relatedPersons = [],
      householdMembers = [],
      hasHeir,
    } = params;

    if (collateralAssets.length === 0) {
      throw new BadRequestException(
        'Khoản vay bắt buộc phải có ít nhất 1 Tài sản bảo đảm (Quyền sử dụng đất)',
      );
    }

    const { assetsCreateInput } = await this.prepareCollateralAssets(
      officerId,
      collateralAssets,
      hasHeir,
    );

    if (loanType === LoanType.TIN_CHAP) {
      const maxAllowedLoanAmount = calculateMaxLoanLimit(LoanType.TIN_CHAP);
      if (loanAmount > maxAllowedLoanAmount) {
        throw new BadRequestException(
          `Khoản vay Tín chấp của 1 người chỉ được vay tối đa ${maxAllowedLoanAmount.toLocaleString('vi-VN')}đ (số tiền yêu cầu: ${loanAmount.toLocaleString('vi-VN')}đ)`,
        );
      }

      return {
        indentureNumber: indentureNumber?.trim() || null,
        mortgageContractNumber: null,
        committeeNotarizationDate: null,
        mortgageContractTermDate: null,
        valuationDate: null,
        valuationType: null,
        totalCollateralValuation: null,
        maxAllowedLoanAmount,
        assetsCreateInput,
        valuationItemsCreateInput:
          [] as Prisma.CollateralValuationItemCreateWithoutLoanInput[],
        relatedPersonsCreateInput:
          [] as Prisma.RelatedPersonCreateWithoutLoanInput[],
        householdMembersCreateInput:
          [] as Prisma.HouseholdMemberCreateWithoutLoanInput[],
      };
    }

    // Với loại vay Thế chấp: Số khế ước và Số hợp đồng thế chấp là bắt buộc, Ngày chứng thực ủy ban là tùy chọn
    if (!indentureNumber?.trim()) {
      throw new BadRequestException(
        'Khoản vay Thế chấp bắt buộc phải có Số khế ước',
      );
    }
    if (!mortgageContractNumber?.trim()) {
      throw new BadRequestException(
        'Khoản vay Thế chấp bắt buộc phải có Số hợp đồng thế chấp',
      );
    }

    const resolvedValuationType = valuationType ?? ValuationType.QUY_DINH_QUY;
    const resolvedValuationDate = valuationDate?.trim()
      ? parseDateInput(valuationDate, 'Ngày định giá')
      : loanDate;

    const { totalValuation, valuationItemsCreateInput } =
      this.prepareValuationItems(
        resolvedValuationType,
        valuationItems,
        collateralAssets,
      );

    const maxAllowedLoanAmount = calculateMaxLoanLimit(
      LoanType.THE_CHAP,
      totalValuation,
    );

    if (loanAmount > maxAllowedLoanAmount) {
      throw new BadRequestException(
        `Số tiền vay Thế chấp (${loanAmount.toLocaleString('vi-VN')}đ) vượt quá hạn mức tối đa 70% tổng định giá tài sản (${maxAllowedLoanAmount.toLocaleString('vi-VN')}đ / Tổng định giá: ${totalValuation.toLocaleString('vi-VN')}đ)`,
      );
    }

    if (
      loanAmount >= RELATED_PERSON_MANDATORY_THRESHOLD &&
      relatedPersons.length === 0
    ) {
      throw new BadRequestException(
        `Khoản vay Thế chấp có số tiền vay từ ${RELATED_PERSON_MANDATORY_THRESHOLD.toLocaleString('vi-VN')}đ trở lên bắt buộc phải nhập ít nhất 1 Người liên quan`,
      );
    }

    const relatedPersonsCreateInput =
      this.prepareRelatedPersons(relatedPersons);
    const householdMembersCreateInput =
      this.prepareHouseholdMembers(householdMembers);

    return {
      indentureNumber: indentureNumber.trim(),
      mortgageContractNumber: mortgageContractNumber.trim(),
      committeeNotarizationDate: committeeNotarizationDate?.trim()
        ? parseDateInput(committeeNotarizationDate, 'Ngày chứng thực ủy ban')
        : null,
      mortgageContractTermDate: mortgageContractTermDate?.trim()
        ? parseDateInput(
            mortgageContractTermDate,
            'Thời hạn hợp đồng thế chấp',
          )
        : null,
      valuationDate: resolvedValuationDate,
      valuationType: resolvedValuationType,
      totalCollateralValuation: totalValuation,
      maxAllowedLoanAmount,
      assetsCreateInput,
      valuationItemsCreateInput,
      relatedPersonsCreateInput,
      householdMembersCreateInput,
    };
  }

  /**
   * Tạo mới Khoản vay gắn trực tiếp với Cán bộ tín dụng hiện tại (officerId)
   */
  async create(officerId: string, dto: CreateLoanDto) {
    if (!dto.borrowerId && !dto.borrower) {
      throw new BadRequestException(
        'Vui lòng cung cấp borrowerId (khách hàng đã có) hoặc thông tin borrower (tạo khách hàng mới)',
      );
    }

    await this.assertIndentureUnique(dto.indentureNumber);

    let hasHeir = false;
    let preparedBorrowerInput: Prisma.BorrowerUncheckedCreateInput | undefined;

    if (dto.borrowerId) {
      const existingBorrower = await this.prisma.borrower.findFirst({
        where: { id: dto.borrowerId, officerId },
        include: { heir: true },
      });
      if (!existingBorrower) {
        throw new NotFoundException(
          `Không tìm thấy người vay với ID: ${dto.borrowerId} thuộc quyền quản lý của bạn`,
        );
      }
      hasHeir = Boolean(existingBorrower.heir);
    } else if (dto.borrower) {
      await this.borrowersService.assertIdNumberUnique(dto.borrower.idNumber);
      preparedBorrowerInput =
        await this.borrowersService.buildCreateBorrowerInput(
          officerId,
          dto.borrower,
        );
      hasHeir = Boolean(dto.borrower.heir);
    }

    const loanDate = parseDateInput(dto.loanDate, 'Ngày vay');
    const status = dto.status ?? LoanStatus.DANG_CHUAN_BI_HO_SO;
    const disbursementInput =
      dto.disbursementDate?.trim() ||
      (status === LoanStatus.DA_GIAI_NGAN ? new Date() : null);

    const { disbursementDate, durationMonths, dueDate } =
      calculateLoanTermAndDueDate(disbursementInput, dto.durationType);

    const interestRate = await this.interestRatesService.resolveInterestRate({
      loanType: dto.loanType,
      durationType: dto.durationType,
      loanAmount: dto.loanAmount,
      customInterestRate: dto.interestRate,
    });

    const relations = await this.validateAndBuildLoanRelations({
      officerId,
      loanType: dto.loanType,
      loanAmount: dto.loanAmount,
      loanDate,
      indentureNumber: dto.indentureNumber,
      mortgageContractNumber: dto.mortgageContractNumber,
      committeeNotarizationDate: dto.committeeNotarizationDate,
      mortgageContractTermDate: dto.mortgageContractTermDate,
      valuationDate: dto.valuationDate,
      valuationType: dto.valuationType,
      collateralAssets: dto.collateralAssets,
      valuationItems: dto.valuationItems,
      relatedPersons: dto.relatedPersons,
      householdMembers: dto.householdMembers,
      hasHeir,
    });

    const loanPlanCreateInput = this.prepareLoanPlan(
      dto.loanPlan,
      dto.loanAmount,
    );

    return this.prisma.$transaction(async (tx) => {
      let targetBorrowerId = dto.borrowerId;

      if (!targetBorrowerId && preparedBorrowerInput) {
        const createdBorrower = await tx.borrower.create({
          data: preparedBorrowerInput,
        });
        targetBorrowerId = createdBorrower.id;
      }

      return tx.loan.create({
        data: {
          officerId,
          borrowerId: targetBorrowerId!,
          loanDate,
          disbursementDate,
          loanAmount: dto.loanAmount,
          indentureNumber: relations.indentureNumber,
          loanType: dto.loanType,
          durationType: dto.durationType,
          durationMonths,
          interestRate,
          dueDate,
          status,
          mortgageContractNumber: relations.mortgageContractNumber,
          committeeNotarizationDate: relations.committeeNotarizationDate,
          mortgageContractTermDate: relations.mortgageContractTermDate,
          valuationDate: relations.valuationDate,
          valuationType: relations.valuationType,
          totalCollateralValuation: relations.totalCollateralValuation,
          maxAllowedLoanAmount: relations.maxAllowedLoanAmount,
          collateralAssets:
            relations.assetsCreateInput.length > 0
              ? { create: relations.assetsCreateInput }
              : undefined,
          valuationItems:
            relations.valuationItemsCreateInput.length > 0
              ? { create: relations.valuationItemsCreateInput }
              : undefined,
          relatedPersons:
            relations.relatedPersonsCreateInput.length > 0
              ? { create: relations.relatedPersonsCreateInput }
              : undefined,
          householdMembers:
            relations.householdMembersCreateInput.length > 0
              ? { create: relations.householdMembersCreateInput }
              : undefined,
          loanPlan: {
            create: loanPlanCreateInput,
          },
        },
        include: LOAN_FULL_INCLUDE,
      });
    });
  }

  /**
   * Mỗi cán bộ tín dụng chỉ thấy danh sách khoản vay do chính mình quản lý
   */
  async findAll(officerId: string, query: QueryLoanDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();

    const where: Prisma.LoanWhereInput = {
      officerId,
      ...(query.borrowerId ? { borrowerId: query.borrowerId } : {}),
      ...(query.loanType ? { loanType: query.loanType } : {}),
      ...(query.durationType ? { durationType: query.durationType } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.hamletId
        ? { borrower: { hamletId: query.hamletId } }
        : {}),
      ...(query.communeId
        ? { borrower: { hamlet: { communeId: query.communeId } } }
        : {}),
      ...(query.territoryGroupId
        ? {
            borrower: {
              hamlet: {
                commune: { territoryGroupId: query.territoryGroupId },
              },
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { indentureNumber: { contains: search, mode: 'insensitive' } },
              {
                mortgageContractNumber: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                borrower: {
                  OR: [
                    { fullName: { contains: search, mode: 'insensitive' } },
                    { idNumber: { contains: search } },
                    { memberCode: { contains: search, mode: 'insensitive' } },
                  ],
                },
              },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.loan.findMany({
        where,
        include: LOAN_FULL_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.loan.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(officerId: string, id: string) {
    const loan = await this.prisma.loan.findFirst({
      where: { id, officerId },
      include: LOAN_FULL_INCLUDE,
    });

    if (!loan) {
      throw new NotFoundException(
        `Không tìm thấy khoản vay với ID: ${id} thuộc quyền quản lý của bạn`,
      );
    }

    return loan;
  }

  async update(officerId: string, id: string, dto: UpdateLoanDto) {
    const existing = await this.findOne(officerId, id);

    const nextIndenture =
      dto.indentureNumber !== undefined
        ? dto.indentureNumber?.trim() || null
        : existing.indentureNumber;

    if (nextIndenture && nextIndenture !== existing.indentureNumber) {
      await this.assertIndentureUnique(nextIndenture, id);
    }

    const nextLoanType = dto.loanType ?? existing.loanType;
    const nextDurationType = dto.durationType ?? existing.durationType;
    const nextStatus = dto.status ?? existing.status;
    const nextLoanAmount =
      dto.loanAmount !== undefined
        ? dto.loanAmount
        : Number(existing.loanAmount);
    const nextLoanDate = dto.loanDate
      ? parseDateInput(dto.loanDate, 'Ngày vay')
      : existing.loanDate;

    let nextDisbursementInput: string | Date | null | undefined;
    if (dto.disbursementDate !== undefined) {
      const trimmed = dto.disbursementDate?.trim();
      nextDisbursementInput =
        trimmed ||
        (nextStatus === LoanStatus.DA_GIAI_NGAN ? new Date() : null);
    } else if (
      nextStatus === LoanStatus.DA_GIAI_NGAN &&
      !existing.disbursementDate
    ) {
      nextDisbursementInput = new Date();
    } else {
      nextDisbursementInput = existing.disbursementDate;
    }

    const { disbursementDate, durationMonths, dueDate } =
      calculateLoanTermAndDueDate(nextDisbursementInput, nextDurationType);

    const interestRate = await this.interestRatesService.resolveInterestRate({
      loanType: nextLoanType,
      durationType: nextDurationType,
      loanAmount: nextLoanAmount,
      customInterestRate:
        dto.interestRate !== undefined
          ? dto.interestRate
          : Number(existing.interestRate),
    });

    const hasRelationChanges =
      dto.loanType !== undefined ||
      dto.loanAmount !== undefined ||
      dto.indentureNumber !== undefined ||
      dto.collateralAssets !== undefined ||
      dto.valuationItems !== undefined ||
      dto.valuationDate !== undefined ||
      dto.valuationType !== undefined ||
      dto.relatedPersons !== undefined ||
      dto.householdMembers !== undefined ||
      dto.mortgageContractNumber !== undefined ||
      dto.committeeNotarizationDate !== undefined ||
      dto.mortgageContractTermDate !== undefined;

    let relationDataUpdate: Prisma.LoanUncheckedUpdateInput = {};

    if (hasRelationChanges) {
      const collateralAssetsToValidate: CreateCollateralAssetDto[] =
        dto.collateralAssets ??
        existing.collateralAssets.map((a) => ({
          assetType: a.assetType,
          assetCode: a.assetCode,
          certificateType: a.certificateType,
          certificateNumber: a.certificateNumber,
          plotNumber: a.plotNumber,
          mapSheetNumber: a.mapSheetNumber,
          hamletId: a.hamletId ?? null,
          communeId: a.communeId ?? null,
          area: Number(a.area),
          usageForm: a.usageForm ?? null,
          usagePurpose: a.usagePurpose ?? null,
          usageTerm: a.usageTerm,
          usageOrigin: a.usageOrigin ?? null,
          usageRestriction: a.usageRestriction ?? null,
          ownerType: a.ownerType,
          valuationType: a.valuationType ?? undefined,
          fundLandCategory: a.fundLandCategory ?? undefined,
          unitPrice: a.unitPrice !== null ? Number(a.unitPrice) : undefined,
          guarantor: a.guarantor
            ? {
                fullName: a.guarantor.fullName,
                idType: a.guarantor.idType,
                idNumber: a.guarantor.idNumber,
                issueDate: a.guarantor.issueDate.toISOString(),
                expiryDate: a.guarantor.expiryDate?.toISOString(),
                address: a.guarantor.address,
              }
            : undefined,
        }));

      const valuationItemsToValidate: CreateCollateralValuationItemDto[] =
        dto.valuationItems ??
        existing.valuationItems.map((vi) => ({
          plotNumber: vi.plotNumber,
          mapSheetNumber: vi.mapSheetNumber,
          area: Number(vi.area),
          actualArea: vi.actualArea !== null ? Number(vi.actualArea) : null,
          fundLandCategory: vi.fundLandCategory ?? null,
          unitPrice: Number(vi.unitPrice),
          note: vi.note ?? null,
        }));

      const relatedPersonsToValidate: CreateRelatedPersonDto[] =
        dto.relatedPersons ??
        existing.relatedPersons.map((rp) => ({
          fullName: rp.fullName,
          idType: rp.idType,
          idNumber: rp.idNumber,
          issueDate: rp.issueDate.toISOString(),
          expiryDate: rp.expiryDate?.toISOString(),
          address: rp.address,
          phone: rp.phone ?? undefined,
          relationship: rp.relationship,
          existingLoanAtFund:
            rp.existingLoanAtFund !== null
              ? Number(rp.existingLoanAtFund)
              : null,
        }));

      const householdMembersToValidate: CreateHouseholdMemberDto[] =
        dto.householdMembers ??
        existing.householdMembers.map((hm) => ({
          fullName: hm.fullName,
          idType: hm.idType,
          idNumber: hm.idNumber,
          issueDate: hm.issueDate.toISOString(),
          expiryDate: hm.expiryDate?.toISOString(),
          address: hm.address,
          phone: hm.phone ?? undefined,
        }));

      const relations = await this.validateAndBuildLoanRelations({
        officerId,
        loanType: nextLoanType,
        loanAmount: nextLoanAmount,
        loanDate: nextLoanDate,
        indentureNumber: nextIndenture,
        mortgageContractNumber:
          dto.mortgageContractNumber !== undefined
            ? dto.mortgageContractNumber
            : existing.mortgageContractNumber,
        committeeNotarizationDate:
          dto.committeeNotarizationDate !== undefined
            ? dto.committeeNotarizationDate
            : existing.committeeNotarizationDate?.toISOString(),
        mortgageContractTermDate:
          dto.mortgageContractTermDate !== undefined
            ? dto.mortgageContractTermDate
            : existing.mortgageContractTermDate?.toISOString(),
        valuationDate:
          dto.valuationDate !== undefined
            ? dto.valuationDate
            : existing.valuationDate?.toISOString(),
        valuationType:
          dto.valuationType !== undefined
            ? dto.valuationType
            : existing.valuationType,
        collateralAssets: collateralAssetsToValidate,
        valuationItems: valuationItemsToValidate,
        relatedPersons: relatedPersonsToValidate,
        householdMembers: householdMembersToValidate,
        hasHeir: Boolean(existing.borrower.heir),
      });

      relationDataUpdate = {
        indentureNumber: relations.indentureNumber,
        mortgageContractNumber: relations.mortgageContractNumber,
        committeeNotarizationDate: relations.committeeNotarizationDate,
        mortgageContractTermDate: relations.mortgageContractTermDate,
        valuationDate: relations.valuationDate,
        valuationType: relations.valuationType,
        totalCollateralValuation: relations.totalCollateralValuation,
        maxAllowedLoanAmount: relations.maxAllowedLoanAmount,
        ...(dto.collateralAssets !== undefined ||
        nextLoanType === LoanType.TIN_CHAP
          ? {
              collateralAssets: {
                deleteMany: {},
                ...(relations.assetsCreateInput.length > 0
                  ? { create: relations.assetsCreateInput }
                  : {}),
              },
            }
          : {}),
        ...(dto.valuationItems !== undefined ||
        dto.valuationType !== undefined ||
        nextLoanType === LoanType.TIN_CHAP
          ? {
              valuationItems: {
                deleteMany: {},
                ...(relations.valuationItemsCreateInput.length > 0
                  ? { create: relations.valuationItemsCreateInput }
                  : {}),
              },
            }
          : {}),
        ...(dto.relatedPersons !== undefined ||
        nextLoanType === LoanType.TIN_CHAP
          ? {
              relatedPersons: {
                deleteMany: {},
                ...(relations.relatedPersonsCreateInput.length > 0
                  ? { create: relations.relatedPersonsCreateInput }
                  : {}),
              },
            }
          : {}),
        ...(dto.householdMembers !== undefined ||
        nextLoanType === LoanType.TIN_CHAP
          ? {
              householdMembers: {
                deleteMany: {},
                ...(relations.householdMembersCreateInput.length > 0
                  ? { create: relations.householdMembersCreateInput }
                  : {}),
              },
            }
          : {}),
      };
    }

    let loanPlanUpdate:
      | Prisma.LoanPlanUncheckedUpdateOneWithoutLoanNestedInput
      | undefined;
    if (dto.loanPlan) {
      const preparedPlan = this.prepareLoanPlan(dto.loanPlan, nextLoanAmount);
      loanPlanUpdate = {
        delete: existing.loanPlan ? true : undefined,
        create: preparedPlan,
      };
    }

    return this.prisma.loan.update({
      where: { id },
      data: {
        loanDate: nextLoanDate,
        disbursementDate,
        loanAmount: nextLoanAmount,
        indentureNumber: nextIndenture,
        loanType: nextLoanType,
        durationType: nextDurationType,
        durationMonths,
        interestRate,
        dueDate,
        status: nextStatus,
        ...relationDataUpdate,
        ...(loanPlanUpdate ? { loanPlan: loanPlanUpdate } : {}),
      },
      include: LOAN_FULL_INCLUDE,
    });
  }

  async remove(officerId: string, id: string) {
    await this.findOne(officerId, id);
    await this.prisma.loan.delete({ where: { id } });
    return { deleted: true, id };
  }

  /**
   * Tổng hợp số liệu nhanh cho màn hình Tổng quan của Cán bộ tín dụng
   */
  async getDashboardSummary(officerId: string) {
    const [
      totalLoans,
      totalBorrowers,
      totalGroups,
      totalCommunes,
      totalHamlets,
      loanAggregates,
      byLoanType,
      byDurationType,
      recentLoans,
    ] = await Promise.all([
      this.prisma.loan.count({ where: { officerId } }),
      this.prisma.borrower.count({ where: { officerId } }),
      this.prisma.territoryGroup.count({ where: { officerId } }),
      this.prisma.commune.count({ where: { officerId } }),
      this.prisma.hamlet.count({ where: { officerId } }),
      this.prisma.loan.aggregate({
        where: { officerId },
        _sum: {
          loanAmount: true,
          totalCollateralValuation: true,
        },
      }),
      this.prisma.loan.groupBy({
        by: ['loanType'],
        where: { officerId },
        _count: { _all: true },
        _sum: { loanAmount: true },
      }),
      this.prisma.loan.groupBy({
        by: ['durationType'],
        where: { officerId },
        _count: { _all: true },
        _sum: { loanAmount: true },
      }),
      this.prisma.loan.findMany({
        where: { officerId },
        include: {
          borrower: {
            select: {
              id: true,
              fullName: true,
              idNumber: true,
              address: true,
              memberCode: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    ]);

    return {
      totalLoans,
      totalBorrowers,
      totalGroups,
      totalCommunes,
      totalHamlets,
      totalLoanAmount: Number(loanAggregates._sum.loanAmount ?? 0),
      totalCollateralValuation: Number(
        loanAggregates._sum.totalCollateralValuation ?? 0,
      ),
      byLoanType: byLoanType.map((item) => ({
        loanType: item.loanType,
        count: item._count._all,
        amount: Number(item._sum.loanAmount ?? 0),
      })),
      byDurationType: byDurationType.map((item) => ({
        durationType: item.durationType,
        count: item._count._all,
        amount: Number(item._sum.loanAmount ?? 0),
      })),
      recentLoans,
    };
  }

  async previewCalculation(dto: PreviewLoanCalculationDto) {
    const { disbursementDate, durationMonths, dueDate } =
      calculateLoanTermAndDueDate(dto.disbursementDate, dto.durationType);

    const matchedRateTier = await this.interestRatesService.lookupRate({
      loanType: dto.loanType,
      durationType: dto.durationType,
      loanAmount: dto.loanAmount,
    });

    const assetValuations = (dto.collateralAssets ?? []).map((item) =>
      calculateCollateralAssetValuation({
        area: item.area,
        actualArea: item.actualArea,
        valuationType: item.valuationType,
        fundLandCategory: item.fundLandCategory,
        unitPrice: item.unitPrice,
      }),
    );

    const totalCollateralValuation = assetValuations.reduce(
      (sum, item) => sum + item.valuationAmount,
      0,
    );

    const maxAllowedLoanAmount = calculateMaxLoanLimit(
      dto.loanType,
      totalCollateralValuation,
    );

    const requiresRelatedPersons =
      dto.loanType === LoanType.THE_CHAP &&
      dto.loanAmount >= RELATED_PERSON_MANDATORY_THRESHOLD;

    const loanPlanSummary =
      dto.expenses || dto.revenues || dto.totalCapitalNeed
        ? calculateLoanPlanSummary({
            totalCapitalNeed: dto.totalCapitalNeed,
            expenses: dto.expenses ?? [],
            revenues: dto.revenues ?? [],
            fundLoanCapital: dto.loanAmount,
          })
        : null;

    return {
      disbursementDate: formatDateDDMMYYYY(disbursementDate),
      durationMonths,
      dueDate: formatDateDDMMYYYY(dueDate),
      suggestedInterestRate: matchedRateTier
        ? Number(matchedRateTier.interestRate)
        : null,
      matchedRateTier,
      assetValuations,
      totalCollateralValuation,
      maxAllowedLoanAmount,
      isLoanAmountWithinLimit: dto.loanAmount <= maxAllowedLoanAmount,
      requiresRelatedPersons,
      loanPlanSummary,
    };
  }
}
