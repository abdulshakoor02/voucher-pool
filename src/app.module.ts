import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard, seconds } from '@nestjs/throttler';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { AppService } from './app.service';
import { DbService } from './database/database.service';
import { VoucherService } from './voucher/voucher.service';
import { CustomerController } from './customer/customer.controller';
import { VoucherController } from './voucher/voucher.controller';
import { SpecialOffersController } from './specialOffers/specialOffers.controller';
import { LoggingInterceptor } from './http-interceptor/logging.interceptor';
import { LoggerService } from './logger/logger.service';
import { BloomFilterService } from './bloomFilters/bloom.service';
import { env } from './env';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: seconds(env.apiRateTTL),
          limit: env.apiRateLimit,
        },
      ],
      errorMessage: 'Too many requests. Please try again later.',
    }),
  ],
  controllers: [CustomerController, VoucherController, SpecialOffersController],
  providers: [
    AppService,
    DbService,
    VoucherService,
    LoggerService,
    BloomFilterService,
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
