import { Module } from '@nestjs/common';
import { BorrowersModule } from '../borrowers/borrowers.module.js';
import { InterestRatesModule } from '../interest-rates/interest-rates.module.js';
import { TerritoriesModule } from '../territories/territories.module.js';
import { LoansController } from './loans.controller.js';
import { LoansService } from './loans.service.js';

@Module({
  imports: [BorrowersModule, InterestRatesModule, TerritoriesModule],
  controllers: [LoansController],
  providers: [LoansService],
  exports: [LoansService],
})
export class LoansModule {}
