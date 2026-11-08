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
import { BorrowersService } from './borrowers.service.js';
import { CreateBorrowerDto } from './dto/create-borrower.dto.js';
import {
  QueryBorrowerDto,
  UpdateBorrowerDto,
} from './dto/update-borrower.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('borrowers')
export class BorrowersController {
  constructor(private readonly borrowersService: BorrowersService) {}

  @Post()
  create(
    @CurrentOfficer('id') officerId: string,
    @Body() dto: CreateBorrowerDto,
  ) {
    return this.borrowersService.create(officerId, dto);
  }

  @Get()
  findAll(
    @CurrentOfficer('id') officerId: string,
    @Query() query: QueryBorrowerDto,
  ) {
    return this.borrowersService.findAll(officerId, query);
  }

  @Get('check-id/:idNumber')
  checkIdNumber(@Param('idNumber') idNumber: string) {
    return this.borrowersService.checkIdNumber(idNumber);
  }

  @Get(':id')
  findOne(
    @CurrentOfficer('id') officerId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.borrowersService.findOne(officerId, id);
  }

  @Patch(':id')
  update(
    @CurrentOfficer('id') officerId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBorrowerDto,
  ) {
    return this.borrowersService.update(officerId, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentOfficer('id') officerId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.borrowersService.remove(officerId, id);
  }
}
