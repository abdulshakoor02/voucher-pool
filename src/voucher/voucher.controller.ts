import { Body, Controller, Post } from '@nestjs/common';
import { VoucherService } from './voucher.service';
import { VouchersDto } from './interfaces/voucher.interface';

@Controller('voucher')
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  @Post('create')
  async CreateToken(@Body() body: VouchersDto): Promise<any> {
    const { specialOfferId, expirationDate } = body;
    const res = await this.voucherService.genreateVoucherForAllCustomer(
      specialOfferId,
      expirationDate,
    );
    return res;
  }
}
