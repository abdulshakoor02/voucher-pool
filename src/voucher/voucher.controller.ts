import {
  Body,
  Controller,
  Post,
  InternalServerErrorException,
} from '@nestjs/common';
import { VoucherService } from './voucher.service';
import { VouchersDto } from './interfaces/voucher.interface';
import { LoggerService } from 'src/logger/logger.service';
import { VoucherViewQueryDto } from './interfaces/voucherView.interface';

@Controller('voucher')
export class VoucherController {
  constructor(
    private readonly voucherService: VoucherService,
    private readonly log: LoggerService,
  ) {}

  @Post('create')
  async CreateToken(@Body() body: VouchersDto): Promise<any> {
    try {
      const { specialOfferId, expirationDate } = body;
      const res = await this.voucherService.genreateVoucherForAllCustomer(
        specialOfferId,
        expirationDate,
      );
      return res;
    } catch (error) {
      this.log.error(`failed to create voucher ${error}`);
      throw new InternalServerErrorException(
        `Internal server error failed to create voucher`,
      );
    }
  }

  @Post('verify')
  async VerifyCoupon(@Body() body: VoucherViewQueryDto) {
    try {
      const res = this.voucherService.verifyCoupon(body);
      return res;
    } catch (error) {
      this.log.error(`failed to verify voucher ${error}`);
      throw new InternalServerErrorException(
        `Internal server error failed to verify voucher`,
      );
    }
  }

  @Post('getCoupons')
  async getCouponByEmail(@Body() body: { email: string }) {
    try {
      const res = this.voucherService.getCouponByEmail(body);
      return res;
    } catch (error) {
      this.log.error(`failed to verify voucher ${error}`);
      throw new InternalServerErrorException(
        `Internal server error failed to verify voucher`,
      );
    }
  }
}
