import { Module } from '@nestjs/common';
import { TerritoriesModule } from '../territories/territories.module.js';
import { BorrowersController } from './borrowers.controller.js';
import { BorrowersService } from './borrowers.service.js';

@Module({
  imports: [TerritoriesModule],
  controllers: [BorrowersController],
  providers: [BorrowersService],
  exports: [BorrowersService],
})
export class BorrowersModule {}
