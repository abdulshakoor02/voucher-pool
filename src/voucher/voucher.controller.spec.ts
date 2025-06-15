import { Test, TestingModule } from '@nestjs/testing';
import { VoucherController } from './voucher.controller';
import { VoucherService } from './voucher.service';
import { LoggerService } from '../logger/logger.service';
import { InternalServerErrorException } from '@nestjs/common';
import { VouchersDto } from './interfaces/voucher.interface';
import { VoucherViewQueryDto } from './interfaces/voucherView.interface';
// GetCouponDto is implicitly { email: string } as per controller, no specific DTO file was found/needed if it's just that.

describe('VoucherController', () => {
  let controller: VoucherController;
  let voucherService: VoucherService;
  let loggerService: LoggerService;

  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    info: jest.fn(),
  };

  const mockVoucherService = {
    genreateVoucherForAllCustomer: jest.fn(),
    verifyCoupon: jest.fn(),
    getCouponByEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VoucherController],
      providers: [
        { provide: VoucherService, useValue: mockVoucherService },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    }).compile();

    controller = module.get<VoucherController>(VoucherController);
    voucherService = module.get<VoucherService>(VoucherService);
    loggerService = module.get<LoggerService>(LoggerService);

    mockLoggerService.error.mockClear();
    mockLoggerService.log.mockClear();
    mockVoucherService.genreateVoucherForAllCustomer.mockClear();
    mockVoucherService.verifyCoupon.mockClear();
    mockVoucherService.getCouponByEmail.mockClear();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('CreateToken', () => {
    const createTokenDto: VouchersDto = {
      specialOfferId: 'offer-uuid-123',
      expirationDate: '2024-12-31',
    };
    const mockResponse = { message: 'Vouchers created successfully' };

    it('should call genreateVoucherForAllCustomer and return success response', async () => {
      mockVoucherService.genreateVoucherForAllCustomer.mockResolvedValue(
        mockResponse,
      );

      const result = await controller.CreateToken(createTokenDto);

      expect(voucherService.genreateVoucherForAllCustomer).toHaveBeenCalledWith(
        createTokenDto.specialOfferId,
        createTokenDto.expirationDate,
      );
      expect(result).toEqual(mockResponse);
      expect(loggerService.info).not.toHaveBeenCalled(); // Controller does not log on success
      expect(loggerService.error).not.toHaveBeenCalled();
    });

    it('should handle errors and throw InternalServerErrorException', async () => {
      const errorMessage = 'Error generating vouchers';
      const error = new Error(errorMessage);
      mockVoucherService.genreateVoucherForAllCustomer.mockRejectedValue(error);

      await expect(controller.CreateToken(createTokenDto)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(voucherService.genreateVoucherForAllCustomer).toHaveBeenCalledWith(
        createTokenDto.specialOfferId,
        createTokenDto.expirationDate,
      );
      expect(loggerService.error).toHaveBeenCalledWith(
        `failed to create voucher ${error}`, // Corrected log message and signature
      );
    });
  });

  describe('VerifyCoupon', () => {
    // Corrected DTO field name from token to voucherCode
    const verifyCouponDto: VoucherViewQueryDto = {
      email: 'test@example.com',
      voucherCode: 'VALIDTOKEN',
    };
    const mockVerificationResponse = {
      discount: 10,
      message: 'Coupon verified',
    };

    it('should call verifyCoupon and return success response', async () => {
      mockVoucherService.verifyCoupon.mockResolvedValue(
        mockVerificationResponse,
      );

      const result = await controller.VerifyCoupon(verifyCouponDto);

      // Corrected service call to pass the DTO object
      expect(voucherService.verifyCoupon).toHaveBeenCalledWith(verifyCouponDto);
      expect(result).toEqual(mockVerificationResponse);
      expect(loggerService.info).not.toHaveBeenCalled(); // Controller does not log on success
      expect(loggerService.error).not.toHaveBeenCalled();
    });

    it('should handle errors and throw InternalServerErrorException', async () => {
      const errorMessage = 'Error verifying coupon';
      const error = new Error(errorMessage);
      mockVoucherService.verifyCoupon.mockRejectedValue(error);

      // Controller has been fixed with await, so InternalServerErrorException should be thrown.
      await expect(controller.VerifyCoupon(verifyCouponDto)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(voucherService.verifyCoupon).toHaveBeenCalledWith(verifyCouponDto);
      // loggerService.error should now be called by the controller's catch block.
      expect(loggerService.error).toHaveBeenCalledWith(
        `failed to verify voucher ${error}`,
      );
    });
  });

  describe('getCouponByEmail', () => {
    const getCouponDto = { email: 'test@example.com' }; // Matches controller: body: { email: string }
    const mockCouponsResponse = [{ token: 'TOKEN1' }, { token: 'TOKEN2' }];

    it('should call getCouponByEmail and return coupons', async () => {
      mockVoucherService.getCouponByEmail.mockResolvedValue(
        mockCouponsResponse,
      );

      const result = await controller.getCouponByEmail(getCouponDto);

      // Corrected service call to pass the DTO object
      expect(voucherService.getCouponByEmail).toHaveBeenCalledWith(
        getCouponDto,
      );
      expect(result).toEqual(mockCouponsResponse);
      expect(loggerService.info).not.toHaveBeenCalled(); // Controller does not log on success
      expect(loggerService.error).not.toHaveBeenCalled();
    });

    it('should handle errors and throw InternalServerErrorException', async () => {
      const errorMessage = 'Error fetching coupons';
      const error = new Error(errorMessage);
      mockVoucherService.getCouponByEmail.mockRejectedValue(error);

      // Controller has been fixed with await, so InternalServerErrorException should be thrown.
      await expect(controller.getCouponByEmail(getCouponDto)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(voucherService.getCouponByEmail).toHaveBeenCalledWith(
        getCouponDto,
      );
      // loggerService.error should now be called with the corrected log message.
      expect(loggerService.error).toHaveBeenCalledWith(
        `failed to retrieve vouchers for email ${getCouponDto.email}: ${error}`,
      );
    });
  });
});
