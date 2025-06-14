import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbService } from './database/database.service';
import { VoucherService } from './voucher/voucher.service';
import { CustomerController } from './customer/customer.controller';
import { VoucherController } from './voucher/voucher.controller';
import { SpecialOffersController } from './specialOffers/specialOffers.controller';

@Module({
  imports: [],
  controllers: [
    AppController,
    CustomerController,
    VoucherController,
    SpecialOffersController,
  ],
  providers: [AppService, DbService, VoucherService],
})
export class AppModule {}
