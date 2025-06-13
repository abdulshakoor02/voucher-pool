import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbService } from './database/database.service';
import { CustomerController } from './customer/customer.controller';

@Module({
  imports: [],
  controllers: [AppController, CustomerController],
  providers: [AppService, DbService],
})
export class AppModule {}
