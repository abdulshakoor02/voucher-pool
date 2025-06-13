import { Body, Controller, Post } from '@nestjs/common';
import { CustomerModel, CustomerDto, ICustomerModel } from './interfaces';

@Controller('customer')
export class CustomerController {
  // constructor(private readonly appService: AppService) {}

  @Post('create')
  async CreateCustomer(@Body() body: CustomerDto): Promise<ICustomerModel> {
    const customer = await CustomerModel.create(body);

    return customer;
  }
}
