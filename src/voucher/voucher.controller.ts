import {
  Body,
  Controller,
  Post,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiProperty,
} from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { VoucherService } from './voucher.service';
import { VouchersDto } from './interfaces/voucher.interface';
import { LoggerService } from 'src/logger/logger.service';
import {
  VoucherViewQueryDto,
  VoucherViewModel,
} from './interfaces/voucherView.interface'; // Assuming VoucherViewModel for responses

// DTO for getCouponByEmail endpoint
export class GetCouponsByEmailDto {
  @ApiProperty({
    description: 'The email address of the customer to retrieve coupons for',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

@ApiTags('Vouchers')
@Controller('voucher')
export class VoucherController {
  constructor(
    private readonly voucherService: VoucherService,
    private readonly log: LoggerService,
  ) {}

  @Post('create')
  @ApiOperation({
    summary:
      'Create new voucher codes for all customers for a given special offer',
  })
  @ApiBody({
    description: 'Special offer ID and expiration date for the new vouchers',
    type: VouchersDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Vouchers created successfully.',
    type: [VoucherViewModel], // Placeholder, actual response might vary
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({
    status: 500,
    description: 'Internal server error failed to create vouchers.',
  })
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
  @ApiOperation({ summary: 'Verify a voucher coupon code for a customer' })
  @ApiBody({
    description: 'Customer email and voucher code to verify',
    type: VoucherViewQueryDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Voucher verification result.',
    type: VoucherViewModel, // Placeholder, actual response might be different
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 404, description: 'Voucher not found or invalid.' })
  @ApiResponse({
    status: 500,
    description: 'Internal server error failed to verify voucher.',
  })
  async VerifyCoupon(@Body() body: VoucherViewQueryDto) {
    try {
      const res = await this.voucherService.verifyCoupon(body);
      return res;
    } catch (error) {
      this.log.error(`failed to verify voucher ${error}`);
      throw new InternalServerErrorException(
        `Internal server error failed to verify voucher`,
      );
    }
  }

  @Post('getCoupons')
  @ApiOperation({
    summary: 'Get all valid voucher coupons for a customer by email',
  })
  @ApiBody({
    description: "Customer's email to retrieve their voucher coupons",
    type: GetCouponsByEmailDto,
  })
  @ApiResponse({
    status: 200,
    description: "List of customer's valid voucher coupons.",
    type: [VoucherViewModel], // Placeholder
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({
    status: 500,
    description: 'Internal server error failed to retrieve vouchers.',
  })
  async getCouponByEmail(@Body() body: GetCouponsByEmailDto) {
    try {
      const res = await this.voucherService.getCouponByEmail(body);
      return res;
    } catch (error) {
      this.log.error(
        `failed to retrieve vouchers for email ${body.email}: ${error}`,
      );
      throw new InternalServerErrorException(
        `Internal server error failed to retrieve vouchers`,
      );
    }
  }
}
