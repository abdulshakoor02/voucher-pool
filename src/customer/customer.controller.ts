import {
  Body,
  Controller,
  Post,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import { CustomerModel, CustomerDto, ICustomerModel } from './interfaces';
import { LoggerService } from 'src/logger/logger.service';

@ApiTags('Customers')
@Controller('customer')
export class CustomerController {
  constructor(private readonly log: LoggerService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiBody({
    description: 'Data for creating a new customer',
    type: CustomerDto,
  })
  @ApiResponse({
    status: 201,
    description: 'The customer has been successfully created.',
    // Note: Using CustomerModel directly might expose too much or not be ideal.
    // Consider creating a CustomerResponseDto if CustomerModel is a Sequelize model.
    // For now, assuming it works or will be refined later.
    type: CustomerModel,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Invalid input data.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error failed to create customer.',
  })
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
