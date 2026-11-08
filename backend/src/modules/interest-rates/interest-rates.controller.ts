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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
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
import { InterestRatesService } from './interest-rates.service.js';

@UseGuards(JwtAuthGuard)
@Controller('interest-rates')
export class InterestRatesController {
  constructor(private readonly interestRatesService: InterestRatesService) {}

  @Post('batches')
  createBatch(@Body() dto: CreateInterestRateBatchDto) {
    return this.interestRatesService.createBatch(dto);
  }

  @Get('batches')
  findAllBatches() {
    return this.interestRatesService.findAllBatches();
  }

  @Get('batches/:id')
  findOneBatch(@Param('id', ParseUUIDPipe) id: string) {
    return this.interestRatesService.findOneBatch(id);
  }

  @Patch('batches/:id')
  updateBatch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInterestRateBatchDto,
  ) {
    return this.interestRatesService.updateBatch(id, dto);
  }

  @Patch('batches/:id/apply')
  applyBatch(@Param('id', ParseUUIDPipe) id: string) {
    return this.interestRatesService.applyBatch(id);
  }

  @Delete('batches/:id')
  removeBatch(@Param('id', ParseUUIDPipe) id: string) {
    return this.interestRatesService.removeBatch(id);
  }

  @Post()
  create(@Body() dto: CreateInterestRateTierDto) {
    return this.interestRatesService.create(dto);
  }

  @Get()
  findAll(@Query() query: QueryInterestRateTierDto) {
    return this.interestRatesService.findAll(query);
  }

  @Get('lookup')
  lookupRate(@Query() query: LookupInterestRateDto) {
    return this.interestRatesService.lookupRate(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.interestRatesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateInterestRateTierDto,
  ) {
    return this.interestRatesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.interestRatesService.remove(id);
  }
}
