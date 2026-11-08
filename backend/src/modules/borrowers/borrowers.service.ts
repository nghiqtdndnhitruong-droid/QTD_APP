import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  buildPersonIdentityFields,
  parseIdentityCardNumber,
  resolveIssuingAuthority,
} from '../../common/helpers/index.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { TerritoriesService } from '../territories/territories.service.js';
import { CreateBorrowerDto } from './dto/create-borrower.dto.js';
import {
  QueryBorrowerDto,
  UpdateBorrowerDto,
} from './dto/update-borrower.dto.js';

const BORROWER_INCLUDE = {
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
} satisfies Prisma.BorrowerInclude;

@Injectable()
export class BorrowersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly territoriesService: TerritoriesService,
  ) {}

  /**
   * Kiểm tra số giấy tờ (12 số) đã tồn tại trong hệ thống chưa.
   * Số giấy tờ của người vay là unique, nếu trùng thì cảnh báo và không cho tạo.
   */
  async assertIdNumberUnique(
    idNumber: string,
    excludeBorrowerId?: string,
  ): Promise<void> {
    const existing = await this.prisma.borrower.findUnique({
      where: { idNumber: idNumber.trim() },
      select: { id: true, fullName: true, idNumber: true },
    });

    if (existing && existing.id !== excludeBorrowerId) {
      throw new ConflictException(
        `Đã tồn tại khách hàng "${existing.fullName}" với số giấy tờ "${existing.idNumber}". Số giấy tờ là duy nhất, không cho phép tạo trùng.`,
      );
    }
  }

  /**
   * Chuẩn hóa dữ liệu tạo mới Người vay (ghép địa chỉ từ địa bàn Ấp - Xã - Tỉnh Vĩnh Long)
   * và Người thừa kế (nhập địa chỉ tự do)
   */
  async buildCreateBorrowerInput(
    officerId: string,
    dto: CreateBorrowerDto,
  ): Promise<Prisma.BorrowerUncheckedCreateInput> {
    const borrowerIdentity = buildPersonIdentityFields(dto, 'người vay');
    const { hamletId, formattedAddress } =
      await this.territoriesService.resolveHamletAddressForOfficer(
        officerId,
        dto.hamletId,
        'Địa bàn (Ấp) của người vay',
      );

    const heirCreateInput:
      | Prisma.HeirUncheckedCreateNestedOneWithoutBorrowerInput
      | undefined = dto.heir
      ? (() => {
          const heirIdentity = buildPersonIdentityFields(
            dto.heir,
            'người thừa kế',
          );
          return {
            create: {
              fullName: dto.heir.fullName.trim(),
              idType: heirIdentity.idType,
              idNumber: heirIdentity.idNumber,
              issuingAuthority: heirIdentity.issuingAuthority,
              issueDate: heirIdentity.issueDate,
              expiryDate: heirIdentity.expiryDate,
              gender: heirIdentity.gender,
              birthYear: heirIdentity.birthYear,
              address: dto.heir.address.trim(),
              phone: dto.heir.phone?.trim() || null,
              relationship: dto.heir.relationship,
            },
          };
        })()
      : undefined;

    return {
      officerId,
      hamletId,
      fullName: dto.fullName.trim(),
      idType: borrowerIdentity.idType,
      idNumber: borrowerIdentity.idNumber,
      issuingAuthority: borrowerIdentity.issuingAuthority,
      issueDate: borrowerIdentity.issueDate,
      expiryDate: borrowerIdentity.expiryDate,
      gender: borrowerIdentity.gender,
      birthYear: borrowerIdentity.birthYear,
      address: formattedAddress,
      memberCode: dto.memberCode?.trim() || null,
      phone: dto.phone?.trim() || null,
      ...(heirCreateInput ? { heir: heirCreateInput } : {}),
    };
  }

  async create(officerId: string, dto: CreateBorrowerDto) {
    await this.assertIdNumberUnique(dto.idNumber);
    const data = await this.buildCreateBorrowerInput(officerId, dto);

    return this.prisma.borrower.create({
      data,
      include: BORROWER_INCLUDE,
    });
  }

  /**
   * Mỗi cán bộ chỉ thấy khách hàng thuộc quyền quản lý của mình
   */
  async findAll(officerId: string, query: QueryBorrowerDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();

    const where: Prisma.BorrowerWhereInput = {
      officerId,
      ...(query.hamletId ? { hamletId: query.hamletId } : {}),
      ...(query.communeId
        ? { hamlet: { communeId: query.communeId } }
        : {}),
      ...(query.territoryGroupId
        ? { hamlet: { commune: { territoryGroupId: query.territoryGroupId } } }
        : {}),
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { idNumber: { contains: search } },
              { memberCode: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } },
              { address: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.borrower.findMany({
        where,
        include: BORROWER_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.borrower.count({ where }),
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
    const borrower = await this.prisma.borrower.findFirst({
      where: { id, officerId },
      include: {
        ...BORROWER_INCLUDE,
        loans: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!borrower) {
      throw new NotFoundException(
        `Không tìm thấy khách hàng với ID: ${id} thuộc quyền quản lý của bạn`,
      );
    }

    return borrower;
  }

  async checkIdNumber(idNumber: string) {
    const parsed = parseIdentityCardNumber(idNumber);
    const existing = await this.prisma.borrower.findUnique({
      where: { idNumber: parsed.idNumber },
      select: {
        id: true,
        fullName: true,
        idNumber: true,
        memberCode: true,
      },
    });

    return {
      ...parsed,
      exists: Boolean(existing),
      existingBorrower: existing,
      issuingAuthorities: {
        CAN_CUOC: resolveIssuingAuthority('CAN_CUOC'),
        CCCD: resolveIssuingAuthority('CCCD'),
      },
    };
  }

  async update(officerId: string, id: string, dto: UpdateBorrowerDto) {
    const existing = await this.findOne(officerId, id);

    if (dto.idNumber && dto.idNumber.trim() !== existing.idNumber) {
      await this.assertIdNumberUnique(dto.idNumber, id);
    }

    const nextIdType = dto.idType ?? existing.idType;
    const nextIdNumber = dto.idNumber ?? existing.idNumber;
    const nextIssueDate = dto.issueDate ?? existing.issueDate;
    const nextExpiryDate =
      dto.expiryDate !== undefined ? dto.expiryDate : existing.expiryDate;

    const borrowerIdentity = buildPersonIdentityFields(
      {
        idType: nextIdType,
        idNumber: nextIdNumber,
        issueDate: nextIssueDate,
        expiryDate: nextExpiryDate,
      },
      'người vay',
    );

    let nextHamletId = existing.hamletId;
    let nextAddress = existing.address;

    if (dto.hamletId && dto.hamletId !== existing.hamletId) {
      const resolved =
        await this.territoriesService.resolveHamletAddressForOfficer(
          officerId,
          dto.hamletId,
          'Địa bàn (Ấp) của người vay',
        );
      nextHamletId = resolved.hamletId;
      nextAddress = resolved.formattedAddress;
    }

    let heirMutation: Prisma.HeirUpdateOneWithoutBorrowerNestedInput | undefined;
    if (dto.heir === null) {
      if (existing.heir) {
        heirMutation = { delete: true };
      }
    } else if (dto.heir) {
      const heirIdentity = buildPersonIdentityFields(
        dto.heir,
        'người thừa kế',
      );
      const heirPayload = {
        fullName: dto.heir.fullName.trim(),
        idType: heirIdentity.idType,
        idNumber: heirIdentity.idNumber,
        issuingAuthority: heirIdentity.issuingAuthority,
        issueDate: heirIdentity.issueDate,
        expiryDate: heirIdentity.expiryDate,
        gender: heirIdentity.gender,
        birthYear: heirIdentity.birthYear,
        address: dto.heir.address.trim(),
        phone: dto.heir.phone?.trim() || null,
        relationship: dto.heir.relationship,
      };
      heirMutation = {
        upsert: {
          create: heirPayload,
          update: heirPayload,
        },
      };
    }

    return this.prisma.borrower.update({
      where: { id },
      data: {
        ...(dto.fullName !== undefined
          ? { fullName: dto.fullName.trim() }
          : {}),
        hamletId: nextHamletId,
        address: nextAddress,
        idType: borrowerIdentity.idType,
        idNumber: borrowerIdentity.idNumber,
        issuingAuthority: borrowerIdentity.issuingAuthority,
        issueDate: borrowerIdentity.issueDate,
        expiryDate: borrowerIdentity.expiryDate,
        gender: borrowerIdentity.gender,
        birthYear: borrowerIdentity.birthYear,
        ...(dto.memberCode !== undefined
          ? { memberCode: dto.memberCode?.trim() || null }
          : {}),
        ...(dto.phone !== undefined
          ? { phone: dto.phone?.trim() || null }
          : {}),
        ...(heirMutation ? { heir: heirMutation } : {}),
      },
      include: BORROWER_INCLUDE,
    });
  }

  async remove(officerId: string, id: string) {
    await this.findOne(officerId, id);
    await this.prisma.borrower.delete({ where: { id } });
    return { deleted: true, id };
  }
}
