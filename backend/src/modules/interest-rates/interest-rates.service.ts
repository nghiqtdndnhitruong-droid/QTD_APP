import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InterestRateTier, LoanDurationType, LoanType } from '@prisma/client';
import { parseDateInput } from '../../common/helpers/index.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  CreateInterestRateBatchDto,
  CreateInterestRateTierDto,
} from './dto/create-interest-rate-tier.dto.js';
import {
  LookupInterestRateDto,
  QueryInterestRateTierDto,
  UpdateInterestRateBatchDto,
  UpdateInterestRateTierDto,
} from './dto/update-interest-rate-tier.dto.js';

@Injectable()
export class InterestRatesService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // QUẢN LÝ ĐỢT BAN HÀNH LÃI SUẤT (BATCH)
  // ==========================================

  async createBatch(dto: CreateInterestRateBatchDto) {
    const effectiveDate = parseDateInput(
      dto.effectiveDate,
      'Thời gian ban hành',
    );

    const existingAppliedCount = await this.prisma.interestRateBatch.count({
      where: { isApplied: true },
    });
    const shouldApply =
      dto.isApplied !== undefined ? dto.isApplied : existingAppliedCount === 0;

    return this.prisma.$transaction(async (tx) => {
      if (shouldApply) {
        await tx.interestRateBatch.updateMany({
          data: { isApplied: false },
        });
        await tx.interestRateTier.updateMany({
          data: { isActive: false },
        });
      }

      return tx.interestRateBatch.create({
        data: {
          effectiveDate,
          documentNote: dto.documentNote?.trim() || null,
          isApplied: shouldApply,
          tiers: {
            create: dto.tiers.map((tier) => ({
              loanType: tier.loanType,
              durationType: tier.durationType,
              minAmount: tier.minAmount,
              maxAmount: tier.maxAmount ?? null,
              interestRate: tier.interestRate,
              description: tier.description?.trim() || null,
              isActive: shouldApply,
            })),
          },
        },
        include: {
          tiers: {
            orderBy: [
              { loanType: 'asc' },
              { durationType: 'asc' },
              { minAmount: 'asc' },
            ],
          },
        },
      });
    });
  }

  async findAllBatches() {
    return this.prisma.interestRateBatch.findMany({
      include: {
        tiers: {
          orderBy: [
            { loanType: 'asc' },
            { durationType: 'asc' },
            { minAmount: 'asc' },
          ],
        },
      },
      orderBy: [{ effectiveDate: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOneBatch(id: string) {
    const batch = await this.prisma.interestRateBatch.findUnique({
      where: { id },
      include: {
        tiers: {
          orderBy: [
            { loanType: 'asc' },
            { durationType: 'asc' },
            { minAmount: 'asc' },
          ],
        },
      },
    });
    if (!batch) {
      throw new NotFoundException(
        `Không tìm thấy đợt ban hành lãi suất với ID: ${id}`,
      );
    }
    return batch;
  }

  async updateBatch(id: string, dto: UpdateInterestRateBatchDto) {
    const existing = await this.findOneBatch(id);
    const effectiveDate = dto.effectiveDate
      ? parseDateInput(dto.effectiveDate, 'Thời gian ban hành')
      : existing.effectiveDate;
    const shouldApply =
      dto.isApplied !== undefined ? dto.isApplied : existing.isApplied;

    return this.prisma.$transaction(async (tx) => {
      if (shouldApply && !existing.isApplied) {
        await tx.interestRateBatch.updateMany({
          where: { id: { not: id } },
          data: { isApplied: false },
        });
        await tx.interestRateTier.updateMany({
          where: { batchId: { not: id } },
          data: { isActive: false },
        });
      }

      if (dto.tiers) {
        await tx.interestRateTier.deleteMany({
          where: { batchId: id },
        });
      } else if (dto.isApplied !== undefined) {
        await tx.interestRateTier.updateMany({
          where: { batchId: id },
          data: { isActive: shouldApply },
        });
      }

      return tx.interestRateBatch.update({
        where: { id },
        data: {
          effectiveDate,
          ...(dto.documentNote !== undefined
            ? { documentNote: dto.documentNote?.trim() || null }
            : {}),
          isApplied: shouldApply,
          ...(dto.tiers
            ? {
                tiers: {
                  create: dto.tiers.map((tier) => ({
                    loanType: tier.loanType,
                    durationType: tier.durationType,
                    minAmount: tier.minAmount,
                    maxAmount: tier.maxAmount ?? null,
                    interestRate: tier.interestRate,
                    description: tier.description?.trim() || null,
                    isActive: shouldApply,
                  })),
                },
              }
            : {}),
        },
        include: {
          tiers: {
            orderBy: [
              { loanType: 'asc' },
              { durationType: 'asc' },
              { minAmount: 'asc' },
            ],
          },
        },
      });
    });
  }

  async applyBatch(id: string) {
    await this.findOneBatch(id);

    return this.prisma.$transaction(async (tx) => {
      await tx.interestRateBatch.updateMany({
        data: { isApplied: false },
      });
      await tx.interestRateTier.updateMany({
        data: { isActive: false },
      });

      await tx.interestRateTier.updateMany({
        where: { batchId: id },
        data: { isActive: true },
      });

      return tx.interestRateBatch.update({
        where: { id },
        data: { isApplied: true },
        include: {
          tiers: {
            orderBy: [
              { loanType: 'asc' },
              { durationType: 'asc' },
              { minAmount: 'asc' },
            ],
          },
        },
      });
    });
  }

  async removeBatch(id: string) {
    await this.findOneBatch(id);
    await this.prisma.interestRateBatch.delete({ where: { id } });
    return { deleted: true, id };
  }

  // ==========================================
  // QUẢN LÝ MỐC LÃI SUẤT ĐƠN LẺ & TRA CỨU
  // ==========================================

  async create(dto: CreateInterestRateTierDto): Promise<InterestRateTier> {
    if (
      dto.maxAmount !== undefined &&
      dto.maxAmount !== null &&
      dto.maxAmount < dto.minAmount
    ) {
      throw new BadRequestException(
        'Mốc số tiền tối đa phải lớn hơn hoặc bằng mốc số tiền tối thiểu',
      );
    }

    return this.prisma.interestRateTier.create({
      data: {
        loanType: dto.loanType,
        durationType: dto.durationType,
        minAmount: dto.minAmount,
        maxAmount: dto.maxAmount ?? null,
        interestRate: dto.interestRate,
        description: dto.description,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findAll(query: QueryInterestRateTierDto): Promise<InterestRateTier[]> {
    return this.prisma.interestRateTier.findMany({
      where: {
        ...(query.loanType ? { loanType: query.loanType } : {}),
        ...(query.durationType ? { durationType: query.durationType } : {}),
        ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      },
      orderBy: [
        { loanType: 'asc' },
        { durationType: 'asc' },
        { minAmount: 'asc' },
      ],
    });
  }

  async findOne(id: string): Promise<InterestRateTier> {
    const tier = await this.prisma.interestRateTier.findUnique({
      where: { id },
    });
    if (!tier) {
      throw new NotFoundException(`Không tìm thấy mốc lãi suất với ID: ${id}`);
    }
    return tier;
  }

  /**
   * Tra cứu mức lãi suất áp dụng theo Loại vay, Thời hạn vay và Số tiền vay
   * Ưu tiên đợt ban hành lãi suất đang được áp dụng (isApplied = true)
   */
  async lookupRate(dto: LookupInterestRateDto): Promise<InterestRateTier | null> {
    const appliedBatchTier = await this.prisma.interestRateTier.findFirst({
      where: {
        batch: { isApplied: true },
        loanType: dto.loanType,
        durationType: dto.durationType,
        minAmount: { lte: dto.loanAmount },
        OR: [{ maxAmount: null }, { maxAmount: { gte: dto.loanAmount } }],
      },
      orderBy: { minAmount: 'desc' },
    });

    if (appliedBatchTier) {
      return appliedBatchTier;
    }

    return this.prisma.interestRateTier.findFirst({
      where: {
        loanType: dto.loanType,
        durationType: dto.durationType,
        isActive: true,
        minAmount: { lte: dto.loanAmount },
        OR: [{ maxAmount: null }, { maxAmount: { gte: dto.loanAmount } }],
      },
      orderBy: { minAmount: 'desc' },
    });
  }

  /**
   * Lấy mức lãi suất cho khoản vay:
   * - Nếu cán bộ có nhập trực tiếp lãi suất (customInterestRate) thì ưu tiên dùng.
   * - Nếu không nhập thì tự động tra cứu từ bảng cấu hình lãi suất trong DB.
   */
  async resolveInterestRate(params: {
    loanType: LoanType;
    durationType: LoanDurationType;
    loanAmount: number;
    customInterestRate?: number | null;
  }): Promise<number> {
    if (
      params.customInterestRate !== undefined &&
      params.customInterestRate !== null &&
      Number.isFinite(params.customInterestRate) &&
      params.customInterestRate > 0
    ) {
      return params.customInterestRate;
    }

    const tier = await this.lookupRate({
      loanType: params.loanType,
      durationType: params.durationType,
      loanAmount: params.loanAmount,
    });

    if (!tier) {
      throw new BadRequestException(
        `Chưa có cấu hình mốc lãi suất cho loại vay ${params.loanType}, thời hạn ${params.durationType} với số tiền ${params.loanAmount.toLocaleString('vi-VN')}đ (hoặc vui lòng nhập trực tiếp mức lãi suất)`,
      );
    }

    return Number(tier.interestRate);
  }

  async update(
    id: string,
    dto: UpdateInterestRateTierDto,
  ): Promise<InterestRateTier> {
    const existing = await this.findOne(id);
    const minAmount = dto.minAmount ?? Number(existing.minAmount);
    const maxAmount =
      dto.maxAmount !== undefined
        ? dto.maxAmount
        : existing.maxAmount !== null
          ? Number(existing.maxAmount)
          : null;

    if (maxAmount !== null && maxAmount < minAmount) {
      throw new BadRequestException(
        'Mốc số tiền tối đa phải lớn hơn hoặc bằng mốc số tiền tối thiểu',
      );
    }

    return this.prisma.interestRateTier.update({
      where: { id },
      data: {
        ...(dto.loanType !== undefined ? { loanType: dto.loanType } : {}),
        ...(dto.durationType !== undefined
          ? { durationType: dto.durationType }
          : {}),
        ...(dto.minAmount !== undefined ? { minAmount: dto.minAmount } : {}),
        ...(dto.maxAmount !== undefined ? { maxAmount: dto.maxAmount } : {}),
        ...(dto.interestRate !== undefined
          ? { interestRate: dto.interestRate }
          : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async remove(id: string): Promise<{ deleted: true; id: string }> {
    await this.findOne(id);
    await this.prisma.interestRateTier.delete({ where: { id } });
    return { deleted: true, id };
  }
}
