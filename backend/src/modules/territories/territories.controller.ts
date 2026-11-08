import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentOfficer } from '../../common/decorators/current-officer.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import {
  CreateCommuneDto,
  CreateHamletDto,
  CreateTerritoryGroupDto,
  QueryHamletDto,
  UpdateCommuneDto,
  UpdateHamletDto,
  UpdateTerritoryGroupDto,
} from './dto/territory.dto.js';
import { TerritoriesService } from './territories.service.js';

@UseGuards(JwtAuthGuard)
@Controller('territories')
export class TerritoriesController {
  constructor(private readonly territoriesService: TerritoriesService) {}

  // ==========================================
  // NHÓM ĐỊA BÀN (CẤP XÃ)
  // ==========================================

  @Post('groups')
  createGroup(
    @CurrentOfficer('id') officerId: string,
    @Body() dto: CreateTerritoryGroupDto,
  ) {
    return this.territoriesService.createGroup(officerId, dto);
  }

  @Get('groups')
  findAllGroups(@CurrentOfficer('id') officerId: string) {
    return this.territoriesService.findAllGroups(officerId);
  }

  @Patch('groups/:id')
  updateGroup(
    @CurrentOfficer('id') officerId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTerritoryGroupDto,
  ) {
    return this.territoriesService.updateGroup(officerId, id, dto);
  }

  @Delete('groups/:id')
  removeGroup(
    @CurrentOfficer('id') officerId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.territoriesService.removeGroup(officerId, id);
  }

  // ==========================================
  // XÃ (THUỘC TỈNH VĨNH LONG)
  // ==========================================

  @Post('communes')
  createCommune(
    @CurrentOfficer('id') officerId: string,
    @Body() dto: CreateCommuneDto,
  ) {
    return this.territoriesService.createCommune(officerId, dto);
  }

  @Get('communes')
  findAllCommunes(@CurrentOfficer('id') officerId: string) {
    return this.territoriesService.findAllCommunes(officerId);
  }

  @Patch('communes/:id')
  updateCommune(
    @CurrentOfficer('id') officerId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCommuneDto,
  ) {
    return this.territoriesService.updateCommune(officerId, id, dto);
  }

  @Delete('communes/:id')
  removeCommune(
    @CurrentOfficer('id') officerId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.territoriesService.removeCommune(officerId, id);
  }

  // ==========================================
  // ẤP (THUỘC XÃ)
  // ==========================================

  @Post('hamlets')
  createHamlet(
    @CurrentOfficer('id') officerId: string,
    @Body() dto: CreateHamletDto,
  ) {
    return this.territoriesService.createHamlet(officerId, dto);
  }

  @Get('hamlets')
  findAllHamlets(
    @CurrentOfficer('id') officerId: string,
    @Query() query: QueryHamletDto,
  ) {
    return this.territoriesService.findAllHamlets(officerId, query);
  }

  @Patch('hamlets/:id')
  updateHamlet(
    @CurrentOfficer('id') officerId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateHamletDto,
  ) {
    return this.territoriesService.updateHamlet(officerId, id, dto);
  }

  @Delete('hamlets/:id')
  removeHamlet(
    @CurrentOfficer('id') officerId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.territoriesService.removeHamlet(officerId, id);
  }
}
