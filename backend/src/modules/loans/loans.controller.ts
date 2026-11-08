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
import { CreateLoanDto } from './dto/create-loan.dto.js';
import {
  PreviewLoanCalculationDto,
  QueryLoanDto,
  UpdateLoanDto,
} from './dto/update-loan.dto.js';
import { LoansService } from './loans.service.js';

@UseGuards(JwtAuthGuard)
@Controller('loans')
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Post()
  create(
    @CurrentOfficer('id') officerId: string,
    @Body() dto: CreateLoanDto,
  ) {
    return this.loansService.create(officerId, dto);
  }

  @Post('preview-calculation')
  previewCalculation(@Body() dto: PreviewLoanCalculationDto) {
    return this.loansService.previewCalculation(dto);
  }

  @Get()
  findAll(
    @CurrentOfficer('id') officerId: string,
    @Query() query: QueryLoanDto,
  ) {
    return this.loansService.findAll(officerId, query);
  }

  @Get(':id')
  findOne(
    @CurrentOfficer('id') officerId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.loansService.findOne(officerId, id);
  }

  @Patch(':id')
  update(
    @CurrentOfficer('id') officerId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLoanDto,
  ) {
    return this.loansService.update(officerId, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentOfficer('id') officerId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.loansService.remove(officerId, id);
  }
}
