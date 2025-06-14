import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbService } from './database/database.service';
import { VoucherService } from './voucher/voucher.service';
import { CustomerController } from './customer/customer.controller';
import { VoucherController } from './voucher/voucher.controller';
import { SpecialOffersController } from './specialOffers/specialOffers.controller';
import { LoggingInterceptor } from './http-interceptor/logging.interceptor';
import { LoggerService } from './logger/logger.service';

@Module({
  imports: [],
  controllers: [
    AppController,
    CustomerController,
    VoucherController,
    SpecialOffersController,
  ],
  providers: [
    AppService,
    DbService,
    VoucherService,
    LoggerService,
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
