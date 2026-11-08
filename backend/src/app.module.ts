import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { BorrowersModule } from './modules/borrowers/borrowers.module.js';
import { InterestRatesModule } from './modules/interest-rates/interest-rates.module.js';
import { LoansModule } from './modules/loans/loans.module.js';
import { TerritoriesModule } from './modules/territories/territories.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    TerritoriesModule,
    InterestRatesModule,
    BorrowersModule,
    LoansModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
