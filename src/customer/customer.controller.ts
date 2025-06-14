import {
  Body,
  Controller,
  Post,
  InternalServerErrorException,
} from '@nestjs/common';
import { CustomerModel, CustomerDto, ICustomerModel } from './interfaces';
import { LoggerService } from 'src/logger/logger.service';

@Controller('customer')
export class CustomerController {
  constructor(private readonly log: LoggerService) {}

  @Post('create')
  async CreateCustomer(@Body() body: CustomerDto): Promise<ICustomerModel> {
    try {
      const customer = await CustomerModel.create(body);
      return customer;
    } catch (error) {
      this.log.error(`failed to create user ${error}`);
      throw new InternalServerErrorException(
        'Internal server error failed to create customer',
      );
    }
  }
}
