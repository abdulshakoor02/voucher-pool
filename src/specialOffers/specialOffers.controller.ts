import {
  Body,
  Controller,
  Post,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  SpecialOffersModel,
  SpecialOffersDto,
  ISpecialOffersModel,
} from './interfaces';
import { LoggerService } from 'src/logger/logger.service';

@Controller('specialoffers')
export class SpecialOffersController {
  constructor(private readonly log: LoggerService) {}

  @Post('create')
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
