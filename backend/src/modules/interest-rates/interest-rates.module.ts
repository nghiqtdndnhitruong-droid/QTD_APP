import { Module } from '@nestjs/common';
import { InterestRatesController } from './interest-rates.controller.js';
import { InterestRatesService } from './interest-rates.service.js';

@Module({
  controllers: [InterestRatesController],
  providers: [InterestRatesService],
  exports: [InterestRatesService],
})
export class InterestRatesModule {}
