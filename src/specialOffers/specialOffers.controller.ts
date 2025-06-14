import { Body, Controller, Post } from '@nestjs/common';
import {
  SpecialOffersModel,
  SpecialOffersDto,
  ISpecialOffersModel,
} from './interfaces';

@Controller('specialoffers')
export class SpecialOffersController {
  // constructor(private readonly appService: AppService) {}

  @Post('create')
  async CreateOffer(
    @Body() body: SpecialOffersDto,
  ): Promise<ISpecialOffersModel> {
    const customer = await SpecialOffersModel.create(body);

    return customer;
  }
}
