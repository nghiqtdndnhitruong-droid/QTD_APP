import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InterestRateTier, LoanDurationType, LoanType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateInterestRateTierDto } from './dto/create-interest-rate-tier.dto.js';
import {
  LookupInterestRateDto,
  QueryInterestRateTierDto,
  UpdateInterestRateTierDto,
} from './dto/update-interest-rate-tier.dto.js';

@Injectable()
export class InterestRatesService {
  constructor(private readonly prisma: PrismaService) {}

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
   */
  async lookupRate(dto: LookupInterestRateDto): Promise<InterestRateTier | null> {
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
