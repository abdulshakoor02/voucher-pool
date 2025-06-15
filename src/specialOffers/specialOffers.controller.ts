import {
  Body,
  Controller,
  Post,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from '@nestjs/swagger';
import {
  SpecialOffersModel,
  SpecialOffersDto,
  ISpecialOffersModel,
} from './interfaces';
import { LoggerService } from 'src/logger/logger.service';

@ApiTags('Special Offers')
@Controller('specialoffers')
export class SpecialOffersController {
  constructor(private readonly log: LoggerService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a new special offer' })
  @ApiBody({
    description: 'Data for creating a new special offer',
    type: SpecialOffersDto,
  })
  @ApiResponse({
    status: 201,
    description: 'The special offer has been successfully created.',
    type: SpecialOffersModel, // Consider a Response DTO
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Invalid input data.',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error failed to create special offer.',
  })
  async CreateOffer(
    @Body() body: SpecialOffersDto,
  ): Promise<ISpecialOffersModel> {
    try {
      const customer = await SpecialOffersModel.create(body);

      return customer;
    } catch (error) {
      this.log.error(`failed to create user ${error}`);
      throw new InternalServerErrorException(
        'Internal server error failed to create special offer',
      );
    }
  }
}
