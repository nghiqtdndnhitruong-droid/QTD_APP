import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DEFAULT_PROVINCE_NAME,
  formatTerritoryAddress,
} from '../../common/helpers/index.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  CreateCommuneDto,
  CreateHamletDto,
  CreateTerritoryGroupDto,
  QueryHamletDto,
  UpdateCommuneDto,
  UpdateHamletDto,
  UpdateTerritoryGroupDto,
} from './dto/territory.dto.js';

@Injectable()
export class TerritoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tra cứu Ấp thuộc quyền quản lý của cán bộ và tự động ghép chuỗi địa chỉ:
   * "Ấp ..., Xã ..., Tỉnh Vĩnh Long"
   */
  async resolveHamletAddressForOfficer(
    officerId: string,
    hamletId: string,
    fieldLabel = 'Địa bàn (Ấp)',
  ): Promise<{ hamletId: string; formattedAddress: string }> {
    const hamlet = await this.prisma.hamlet.findFirst({
      where: {
        id: hamletId,
        officerId,
      },
      include: {
        commune: true,
      },
    });

    if (!hamlet) {
      throw new BadRequestException(
        `${fieldLabel} không tồn tại hoặc không thuộc quyền quản lý của cán bộ hiện tại`,
      );
    }

    return {
      hamletId: hamlet.id,
      formattedAddress: formatTerritoryAddress(
        hamlet.name,
        hamlet.commune.name,
        hamlet.commune.province,
      ),
    };
  }

  /**
   * Tra cứu hàng loạt các Ấp trong 1 truy vấn duy nhất (tối ưu hiệu năng khi tạo khoản vay có nhiều tài sản thế chấp)
   */
  async resolveMultipleHamletsForOfficer(
    officerId: string,
    hamletIds: string[],
  ): Promise<Map<string, string>> {
    const uniqueIds = Array.from(new Set(hamletIds));
    if (uniqueIds.length === 0) {
      return new Map();
    }

    const hamlets = await this.prisma.hamlet.findMany({
      where: {
        id: { in: uniqueIds },
        officerId,
      },
      include: {
        commune: true,
      },
    });

    if (hamlets.length !== uniqueIds.length) {
      throw new BadRequestException(
        'Một hoặc nhiều địa bàn (Ấp) không tồn tại hoặc không thuộc quyền quản lý của cán bộ hiện tại',
      );
    }

    const addressMap = new Map<string, string>();
    for (const h of hamlets) {
      addressMap.set(
        h.id,
        formatTerritoryAddress(h.name, h.commune.name, h.commune.province),
      );
    }
    return addressMap;
  }

  // ==========================================
  // 1. NHÓM ĐỊA BÀN (CẤP XÃ)
  // ==========================================

  async createGroup(officerId: string, dto: CreateTerritoryGroupDto) {
    const name = dto.name.trim();
    const existing = await this.prisma.territoryGroup.findUnique({
      where: { officerId_name: { officerId, name } },
    });

    if (existing) {
      throw new ConflictException(`Nhóm địa bàn "${name}" đã tồn tại`);
    }

    return this.prisma.$transaction(async (tx) => {
      const group = await tx.territoryGroup.create({
        data: {
          officerId,
          name,
        },
      });

      if (dto.communeIds && dto.communeIds.length > 0) {
        await tx.commune.updateMany({
          where: {
            id: { in: dto.communeIds },
            officerId,
          },
          data: {
            territoryGroupId: group.id,
          },
        });
      }

      return tx.territoryGroup.findUnique({
        where: { id: group.id },
        include: {
          communes: {
            include: { hamlets: true },
            orderBy: { name: 'asc' },
          },
        },
      });
    });
  }

  async findAllGroups(officerId: string) {
    return this.prisma.territoryGroup.findMany({
      where: { officerId },
      include: {
        communes: {
          include: { hamlets: { orderBy: { name: 'asc' } } },
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async updateGroup(
    officerId: string,
    id: string,
    dto: UpdateTerritoryGroupDto,
  ) {
    const group = await this.prisma.territoryGroup.findFirst({
      where: { id, officerId },
    });

    if (!group) {
      throw new NotFoundException(`Không tìm thấy nhóm địa bàn với ID: ${id}`);
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.name && dto.name.trim() !== group.name) {
        const duplicate = await tx.territoryGroup.findUnique({
          where: { officerId_name: { officerId, name: dto.name.trim() } },
        });
        if (duplicate) {
          throw new ConflictException(
            `Nhóm địa bàn "${dto.name.trim()}" đã tồn tại`,
          );
        }
        await tx.territoryGroup.update({
          where: { id },
          data: { name: dto.name.trim() },
        });
      }

      if (dto.communeIds !== undefined) {
        await tx.commune.updateMany({
          where: { officerId, territoryGroupId: id },
          data: { territoryGroupId: null },
        });
        if (dto.communeIds.length > 0) {
          await tx.commune.updateMany({
            where: {
              officerId,
              id: { in: dto.communeIds },
            },
            data: { territoryGroupId: id },
          });
        }
      }

      return tx.territoryGroup.findUnique({
        where: { id },
        include: {
          communes: {
            include: { hamlets: true },
            orderBy: { name: 'asc' },
          },
        },
      });
    });
  }

  async removeGroup(officerId: string, id: string) {
    const group = await this.prisma.territoryGroup.findFirst({
      where: { id, officerId },
    });
    if (!group) {
      throw new NotFoundException(`Không tìm thấy nhóm địa bàn với ID: ${id}`);
    }
    await this.prisma.territoryGroup.delete({ where: { id } });
    return { deleted: true, id };
  }

  // ==========================================
  // 2. QUẢN LÝ CẤP XÃ (TỈNH VĨNH LONG)
  // ==========================================

  async createCommune(officerId: string, dto: CreateCommuneDto) {
    const name = dto.name.trim();
    const existing = await this.prisma.commune.findUnique({
      where: { officerId_name: { officerId, name } },
    });
    if (existing) {
      throw new ConflictException(`Xã "${name}" đã tồn tại trong địa bàn của bạn`);
    }

    if (dto.territoryGroupId) {
      const group = await this.prisma.territoryGroup.findFirst({
        where: { id: dto.territoryGroupId, officerId },
      });
      if (!group) {
        throw new BadRequestException('Nhóm địa bàn không hợp lệ');
      }
    }

    const uniqueHamletNames = Array.from(
      new Set(
        (dto.hamletNames ?? []).map((n) => n.trim()).filter(Boolean),
      ),
    );

    return this.prisma.commune.create({
      data: {
        officerId,
        name,
        province: DEFAULT_PROVINCE_NAME,
        territoryGroupId: dto.territoryGroupId ?? null,
        ...(uniqueHamletNames.length > 0
          ? {
              hamlets: {
                create: uniqueHamletNames.map((hName) => ({
                  officerId,
                  name: hName,
                })),
              },
            }
          : {}),
      },
      include: {
        territoryGroup: true,
        hamlets: { orderBy: { name: 'asc' } },
      },
    });
  }

  async findAllCommunes(officerId: string) {
    return this.prisma.commune.findMany({
      where: { officerId },
      include: {
        territoryGroup: true,
        hamlets: { orderBy: { name: 'asc' } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async updateCommune(officerId: string, id: string, dto: UpdateCommuneDto) {
    const commune = await this.prisma.commune.findFirst({
      where: { id, officerId },
    });
    if (!commune) {
      throw new NotFoundException(`Không tìm thấy Xã với ID: ${id}`);
    }

    if (dto.territoryGroupId) {
      const group = await this.prisma.territoryGroup.findFirst({
        where: { id: dto.territoryGroupId, officerId },
      });
      if (!group) {
        throw new BadRequestException('Nhóm địa bàn không hợp lệ');
      }
    }

    return this.prisma.commune.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.territoryGroupId !== undefined
          ? { territoryGroupId: dto.territoryGroupId }
          : {}),
      },
      include: {
        territoryGroup: true,
        hamlets: { orderBy: { name: 'asc' } },
      },
    });
  }

  async removeCommune(officerId: string, id: string) {
    const commune = await this.prisma.commune.findFirst({
      where: { id, officerId },
    });
    if (!commune) {
      throw new NotFoundException(`Không tìm thấy Xã với ID: ${id}`);
    }
    await this.prisma.commune.delete({ where: { id } });
    return { deleted: true, id };
  }

  // ==========================================
  // 3. QUẢN LÝ CẤP ẤP
  // ==========================================

  async createHamlet(officerId: string, dto: CreateHamletDto) {
    const commune = await this.prisma.commune.findFirst({
      where: { id: dto.communeId, officerId },
    });
    if (!commune) {
      throw new NotFoundException(
        'Xã không tồn tại hoặc không thuộc quyền quản lý của cán bộ',
      );
    }

    const name = dto.name.trim();
    const existing = await this.prisma.hamlet.findUnique({
      where: { communeId_name: { communeId: dto.communeId, name } },
    });
    if (existing) {
      throw new ConflictException(
        `Ấp "${name}" đã tồn tại trong "${commune.name}"`,
      );
    }

    const created = await this.prisma.hamlet.create({
      data: {
        officerId,
        communeId: dto.communeId,
        name,
      },
      include: {
        commune: {
          include: { territoryGroup: true },
        },
      },
    });

    return {
      ...created,
      fullAddress: formatTerritoryAddress(
        created.name,
        created.commune.name,
        created.commune.province,
      ),
    };
  }

  async findAllHamlets(officerId: string, query: QueryHamletDto) {
    const search = query.search?.trim();
    const hamlets = await this.prisma.hamlet.findMany({
      where: {
        officerId,
        ...(query.communeId ? { communeId: query.communeId } : {}),
        ...(query.territoryGroupId
          ? { commune: { territoryGroupId: query.territoryGroupId } }
          : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                {
                  commune: {
                    name: { contains: search, mode: 'insensitive' },
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        commune: {
          include: { territoryGroup: true },
        },
      },
      orderBy: [{ commune: { name: 'asc' } }, { name: 'asc' }],
    });

    return hamlets.map((h) => ({
      ...h,
      fullAddress: formatTerritoryAddress(
        h.name,
        h.commune.name,
        h.commune.province,
      ),
    }));
  }

  async updateHamlet(officerId: string, id: string, dto: UpdateHamletDto) {
    const hamlet = await this.prisma.hamlet.findFirst({
      where: { id, officerId },
    });
    if (!hamlet) {
      throw new NotFoundException(`Không tìm thấy Ấp với ID: ${id}`);
    }

    if (dto.communeId) {
      const commune = await this.prisma.commune.findFirst({
        where: { id: dto.communeId, officerId },
      });
      if (!commune) {
        throw new BadRequestException('Xã không hợp lệ');
      }
    }

    const updated = await this.prisma.hamlet.update({
      where: { id },
      data: {
        ...(dto.communeId !== undefined ? { communeId: dto.communeId } : {}),
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
      },
      include: {
        commune: {
          include: { territoryGroup: true },
        },
      },
    });

    return {
      ...updated,
      fullAddress: formatTerritoryAddress(
        updated.name,
        updated.commune.name,
        updated.commune.province,
      ),
    };
  }

  async removeHamlet(officerId: string, id: string) {
    const hamlet = await this.prisma.hamlet.findFirst({
      where: { id, officerId },
    });
    if (!hamlet) {
      throw new NotFoundException(`Không tìm thấy Ấp với ID: ${id}`);
    }
    await this.prisma.hamlet.delete({ where: { id } });
    return { deleted: true, id };
  }
}
