import { Body, Controller, Post } from '@nestjs/common';
import { CustomerModel, CustomerDto, ICustomerModel } from './interfaces';
// import { LoggerService } from 'src/logger/logger.service';

@Controller('customer')
export class CustomerController {
  // constructor(private readonly log: LoggerService) {}

  @Post('create')
  async CreateCustomer(@Body() body: CustomerDto): Promise<ICustomerModel> {
    const customer = await CustomerModel.create(body);
    return customer;
  }
}
