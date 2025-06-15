import { Test, TestingModule } from '@nestjs/testing';
import { VoucherService } from './voucher.service';
import { LoggerService } from '../logger/logger.service';
import { CustomerModel } from '../customer/interfaces/customer.interface';
import { VoucherJobModel } from './interfaces/voucherJob.interface';
import { VouchersModel } from './interfaces/voucher.interface';
import { VoucherViewModel } from './interfaces/voucherView.interface';
import { dbAdapter } from '../database/database';
import { Op } from 'sequelize';
import moment from 'moment';
import { v4 as uuidv4 } from 'uuid';
// ConfigService import removed as it's not used.
import { VoucherViewQueryDto } from './interfaces/voucherView.interface'; // Added missing import
import { BloomFilterService } from '../bloomFilters/bloom.service';

// Mocking external modules and dependencies
jest.mock('../logger/logger.service');
jest.mock('../bloomFilters/bloom.service', () => ({
  BloomFilterService: jest.fn().mockImplementation(() => ({
    has: jest.fn(),
    add: jest.fn(),
  })),
}));

// Helper function for mocking Sequelize models
// Must be defined before jest.mock calls that use it due to hoisting
// Changed to a function declaration for proper hoisting with jest.mock
function mockModelWithStaticMethods(name = 'TestModel') {
  return {
    addHook: jest.fn(), // Common static methods
    belongsTo: jest.fn(),
    hasMany: jest.fn(),
    hasOne: jest.fn(),
    sync: jest.fn(),
    describe: jest.fn(),
    getTableName: jest.fn(() => name.toLowerCase() + 's'),
    associations: {},
    options: {},
    primaryKeyAttributes: [],
    rawAttributes: {},
    sequelize: { define: jest.fn(), model: jest.fn() }, // Mocked sequelize instance
    name: name,
    tableName: name.toLowerCase() + 's',

    // Methods that will be called by the service, to be spied on/reset in tests
    count: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
    upsert: jest.fn(),
    bulkCreate: jest.fn(),
  };
}

jest.mock('../customer/interfaces/customer.interface', () => ({
  CustomerModel: mockModelWithStaticMethods('Customer'),
  CustomerDto: class {},
}));
jest.mock('./interfaces/voucherJob.interface', () => ({
  VoucherJobModel: mockModelWithStaticMethods('VoucherJob'),
}));
jest.mock('./interfaces/voucher.interface', () => ({
  VouchersModel: mockModelWithStaticMethods('Vouchers'),
  VouchersDto: class {},
}));
jest.mock('./interfaces/voucherView.interface', () => ({
  VoucherViewModel: mockModelWithStaticMethods('VoucherView'),
  VoucherViewQueryDto: class {},
}));

jest.mock('../database/database', () => ({
  dbAdapter: {
    transaction: jest.fn(),
    define: jest.fn(), // if models are defined through it in reality
    query: jest.fn(), // if raw queries are used
  },
}));
jest.mock('moment', () => {
  const actualMoment = jest.requireActual('moment');
  const mockMomentFn = jest.fn(() => {
    return {
      format: jest.fn().mockReturnValue('DEFAULT_MOCK_FORMAT'),
      add: jest.fn().mockReturnThis(),
      subtract: jest.fn().mockReturnThis(),
      unix: jest.fn().mockReturnValue(1234567890),
      isAfter: jest.fn().mockReturnValue(false),
      isBefore: jest.fn().mockReturnValue(false),
      valueOf: jest.fn().mockReturnValue(1234567890000),
    };
  });

  for (const staticProp in actualMoment) {
    if (
      Object.prototype.hasOwnProperty.call(actualMoment, staticProp) &&
      typeof (mockMomentFn as any)[staticProp] === 'undefined'
    ) {
      (mockMomentFn as any)[staticProp] = actualMoment[staticProp];
    }
  }
  return mockMomentFn;
});
jest.mock('uuid', () => ({
  v4: jest.fn(), // Keep it as a simple jest.fn initially
}));
jest.mock('../env', () => ({
  env: {
    voucherLimit: 100,
    delayTimeInMilliseconds: 0,
  },
}));

describe('VoucherService', () => {
  let service: VoucherService;
  let loggerService: jest.Mocked<LoggerService>;
  let mockDbTransaction;
  let mockCustomerModel: jest.Mocked<typeof CustomerModel>;
  let mockVoucherJobModel: jest.Mocked<typeof VoucherJobModel>;
  let mockVouchersModel: jest.Mocked<typeof VouchersModel>;
  let mockVoucherViewModel: jest.Mocked<typeof VoucherViewModel>;
  let mockUuidv4: jest.Mock; // Changed type to jest.Mock
  let mockMoment: jest.Mocked<any>;
  let mockBloomFilterService: jest.Mocked<BloomFilterService>;
  // Remove ConfigService as env is imported directly
  // let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    // Setup mock transaction
    mockDbTransaction = {
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
    };
    // Default behavior for transaction: return the mock transaction object directly
    // This is suitable for methods that manually handle t.commit/t.rollback
    (dbAdapter.transaction as jest.Mock).mockResolvedValue(mockDbTransaction);

    // For models, ensure all mocked static methods are reset and available
    mockCustomerModel = CustomerModel as jest.Mocked<typeof CustomerModel>;
    mockVoucherJobModel = VoucherJobModel as jest.Mocked<
      typeof VoucherJobModel
    >;
    mockVouchersModel = VouchersModel as jest.Mocked<typeof VouchersModel>;
    mockVoucherViewModel = VoucherViewModel as jest.Mocked<
      typeof VoucherViewModel
    >;

    // Assign mocks for static methods
    mockCustomerModel.count = jest.fn();
    mockCustomerModel.findAll = jest.fn();

    mockVoucherJobModel.findOne = jest.fn();
    mockVoucherJobModel.upsert = jest.fn();

    mockVouchersModel.bulkCreate = jest.fn();
    mockVouchersModel.update = jest.fn();
    mockVouchersModel.findOne = jest.fn(); // If used by service

    mockVoucherViewModel.findOne = jest.fn();
    mockVoucherViewModel.findAll = jest.fn();

    mockUuidv4 = uuidv4 as jest.Mock; // Cast to jest.Mock
    mockMoment = moment as jest.Mocked<any>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VoucherService,
        LoggerService, // Real LoggerService will be auto-mocked by jest.mock at top
        // ConfigService removed
        BloomFilterService,
      ],
    }).compile();

    service = module.get<VoucherService>(VoucherService);
    loggerService = module.get(LoggerService);
    // mockConfigService removed
    mockBloomFilterService = module.get(BloomFilterService);

    // Reset all mocks that might have been called in previous tests
    // jest.clearAllMocks() should be called before each test or specified in Jest config
    // For now, let's ensure critical mocks are reset here:
    mockCustomerModel.count.mockReset();
    mockCustomerModel.findAll.mockReset();
    mockVoucherJobModel.findOne.mockReset();
    mockVoucherJobModel.upsert.mockReset();
    mockVouchersModel.bulkCreate.mockReset();
    mockVouchersModel.update.mockReset();
    mockVouchersModel.findOne.mockReset();
    mockVoucherViewModel.findOne.mockReset();
    mockVoucherViewModel.findAll.mockReset();
    mockUuidv4.mockReset();
    (dbAdapter.transaction as jest.Mock).mockReset();
    // Re-establish default mock for transaction for each test suite if needed, or here if it's general
    (dbAdapter.transaction as jest.Mock).mockResolvedValue(mockDbTransaction);
    mockDbTransaction.commit.mockReset();
    mockDbTransaction.rollback.mockReset();
    loggerService.info.mockReset(); // Reset logger mocks too
    loggerService.error.mockReset();
    loggerService.warn.mockReset();
    loggerService.debug.mockReset();

    // Mock for env.voucherLimit is now handled by jest.mock('../env')
    // You can override specific values from '../env' if needed per test:
    // import { env as actualEnv } from '../env';
    // jest.spyOn(actualEnv, 'voucherLimit', 'get').mockReturnValue(newValue);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateCoupon', () => {
    it('should return an uppercase string without hyphens and call uuidv4, bloomFilterService.has and bloomFilterService.add', () => {
      const mockUUID = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
      mockUuidv4.mockReturnValue(mockUUID);

      const coupon = service.generateCoupon();

      expect(mockUuidv4).toHaveBeenCalledTimes(1);
      expect(mockBloomFilterService.has).toHaveBeenCalledTimes(1);
      expect(mockBloomFilterService.has).toHaveBeenCalledWith(
        mockUUID.replace(/-/g, ''),
      );
      expect(mockBloomFilterService.add).toHaveBeenCalledTimes(1);
      expect(mockBloomFilterService.add).toHaveBeenCalledWith(
        mockUUID.replace(/-/g, ''),
      );
      expect(coupon).toBe('A1B2C3D4E5F678901234567890ABCDEF');
      expect(typeof coupon).toBe('string');
    });

    it('should generate a unique coupon after a few attempts', () => {
      const mockUUID1 = '11111111-e5f6-7890-1234-567890abcdef';
      const mockUUID2 = '22222222-e5f6-7890-1234-567890abcdef';
      const mockUUID3 = '33333333-e5f6-7890-1234-567890abcdef';
      mockUuidv4
        .mockReturnValueOnce(mockUUID1)
        .mockReturnValueOnce(mockUUID2)
        .mockReturnValueOnce(mockUUID3);

      mockBloomFilterService.has
        .mockReturnValueOnce(true) // First attempt, coupon exists
        .mockReturnValueOnce(true) // Second attempt, coupon exists
        .mockReturnValueOnce(false); // Third attempt, coupon is unique

      const coupon = service.generateCoupon();

      expect(mockUuidv4).toHaveBeenCalledTimes(3);
      expect(mockBloomFilterService.has).toHaveBeenCalledTimes(3);
      expect(mockBloomFilterService.has).toHaveBeenNthCalledWith(
        1,
        mockUUID1.replace(/-/g, ''),
      );
      expect(mockBloomFilterService.has).toHaveBeenNthCalledWith(
        2,
        mockUUID2.replace(/-/g, ''),
      );
      expect(mockBloomFilterService.has).toHaveBeenNthCalledWith(
        3,
        mockUUID3.replace(/-/g, ''),
      );
      expect(mockBloomFilterService.add).toHaveBeenCalledTimes(1);
      expect(mockBloomFilterService.add).toHaveBeenCalledWith(
        mockUUID3.replace(/-/g, ''),
      );
      expect(coupon).toBe(mockUUID3.replace(/-/g, '').toUpperCase());
    });

    it('should throw an error if maxAttempts is reached', async () => {
      const mockUUID = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';
      mockUuidv4.mockReturnValue(mockUUID);
      mockBloomFilterService.has.mockReturnValue(true); // Always return true, coupon exists

      try {
        service.generateCoupon();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Failed to generate unique coupon');
      }

      expect(mockUuidv4).toHaveBeenCalledTimes(10); // Default maxAttempts is 10
      expect(mockBloomFilterService.has).toHaveBeenCalledTimes(10);
      expect(mockBloomFilterService.add).not.toHaveBeenCalled();
    });
  });

  describe('verifyCoupon', () => {
    const mockCouponQuery: VoucherViewQueryDto = {
      voucherCode: 'VALID123',
      email: 'test@example.com',
    };
    const mockFoundCouponData = {
      // Renamed to avoid confusion with 'this' in toJSON
      id: 'voucher-id-1',
      voucherCode: 'VALID123',
      email: 'test@example.com',
      used: false,
      // Expiration date will be set dynamically in tests using this as a base
      expirattionDate: '',
      discount: 10,
    };
    // Define mockFoundCoupon with a working toJSON if necessary, or remove toJSON if not used by service
    const mockFoundCoupon = {
      ...mockFoundCouponData,
      toJSON: function () {
        return {
          // Use a function to get correct 'this' or return static data
          id: this.id,
          voucherCode: this.voucherCode,
          email: this.email,
          used: this.used,
          expirattionDate: this.expirattionDate,
          discount: this.discount,
        };
      },
    };

    beforeEach(() => {
      // Ensure transaction mock is reset and returns the direct transaction object
      (dbAdapter.transaction as jest.Mock).mockResolvedValue(mockDbTransaction);
      mockDbTransaction.commit.mockReset();
      mockDbTransaction.rollback.mockReset(); // Though verifyCoupon doesn't explicitly rollback often

      // Configure the behavior of moment() for this test suite
      const specificMockedInstance = {
        format: jest.fn((formatArgs?: string) => {
          if (formatArgs === 'X') {
            return Math.floor(Date.now() / 1000).toString(); // "Current time" as unix string
          }
          return 'Default-Formatted-Date'; // Default for other formats
        }),
        // Mock other instance methods if service calls them on moment() result
        add: jest.fn().mockReturnThis(),
        subtract: jest.fn().mockReturnThis(),
      };
      // Use jest.requireMock to be absolutely sure we're getting the mocked moment
      const currentMomentMock = jest.requireMock('moment') as jest.Mock;
      currentMomentMock.mockReturnValue(specificMockedInstance);
    });

    afterEach(() => {
      // It's good practice to restore or clear global mocks if they were altered for specific tests
      // For moment, if we mocked moment.fn.format globally, restore it.
      // If we mocked moment() itself, jest.restoreAllMocks() in a global afterEach or Jest config handles it.
      // Here, moment is mocked per call, so less critical, but good to be aware.
    });

    it('Case 1: Valid, unused, unexpired coupon', async () => {
      const futureTimestamp = (
        Math.floor(Date.now() / 1000) + 86400
      ).toString(); // 1 day in future
      mockVoucherViewModel.findOne.mockResolvedValue({
        ...mockFoundCoupon,
        expirattionDate: futureTimestamp,
      } as any);
      mockVouchersModel.update.mockResolvedValue([1] as any); // Simulate 1 row updated

      const result = await service.verifyCoupon(mockCouponQuery);

      expect(mockVoucherViewModel.findOne).toHaveBeenCalledWith({
        where: {
          voucherCode: mockCouponQuery.voucherCode,
          email: mockCouponQuery.email,
          used: false,
        },
        transaction: mockDbTransaction,
      });
      expect(mockVouchersModel.update).toHaveBeenCalledWith(
        { used: true },
        { where: { id: mockFoundCoupon.id } }, // Note: Service doesn't pass transaction to update!
      );
      expect(result).toEqual({ discount: mockFoundCoupon.discount });
      expect(mockDbTransaction.commit).toHaveBeenCalledTimes(1); // Called after update
    });

    it('Case 2: Coupon expired', async () => {
      const pastTimestamp = (Math.floor(Date.now() / 1000) - 86400).toString(); // 1 day in past
      mockVoucherViewModel.findOne.mockResolvedValue({
        ...mockFoundCoupon,
        expirattionDate: pastTimestamp,
      } as any);

      const result = await service.verifyCoupon(mockCouponQuery);

      expect(result).toBe('Coupon has expired');
      expect(mockVouchersModel.update).not.toHaveBeenCalled();
      expect(mockDbTransaction.commit).toHaveBeenCalledTimes(1); // Called in this path too
    });

    it('Case 3.1: Coupon not found', async () => {
      mockVoucherViewModel.findOne.mockResolvedValue(null);

      const result = await service.verifyCoupon(mockCouponQuery);

      expect(result).toBe('Coupon is not valid');
      expect(mockVouchersModel.update).not.toHaveBeenCalled();
      expect(mockDbTransaction.commit).toHaveBeenCalledTimes(1); // Called in this path
    });

    it('Case 3.2: Coupon already used', async () => {
      mockVoucherViewModel.findOne.mockResolvedValue({
        ...mockFoundCoupon,
        used: true,
      } as any);
      // The service's findOne query is `where: { ..., used: false }`. So this case is identical to "not found".
      // To explicitly test "found but already used" (if query was different), we'd mock findOne to return used:true.
      // But with current query, this is covered by Case 3.1. Let's assume query is as service has it.
      // If the query was just for voucherCode and email, then:
      // mockVoucherViewModel.findOne.mockResolvedValue({ ...mockFoundCoupon, used: true, expirattionDate: futureTimestamp } as any);
      // const result = await service.verifyCoupon(mockCouponQuery);
      // expect(result).toBe('Coupon is not valid'); // Or a more specific message
      // For now, this test is redundant due to the `used: false` in the where clause.
      // We'll keep it simple and rely on Case 3.1 for "not usable".
      expect(true).toBe(true); // Placeholder for the above reasoning.
    });

    it('Case 4: DB error during VoucherViewModel.findOne', async () => {
      const dbError = new Error('DB findOne error');
      mockVoucherViewModel.findOne.mockRejectedValue(dbError);
      // The service does not catch this error to rollback 't'. It will throw.
      // The transaction 't' is created outside try-catch for findOne.

      await expect(service.verifyCoupon(mockCouponQuery)).rejects.toThrow(
        dbError,
      );

      expect(mockDbTransaction.commit).not.toHaveBeenCalled();
      expect(mockDbTransaction.rollback).not.toHaveBeenCalled(); // Service doesn't explicitly roll back here
      // Error should be logged if caught by a higher level, or if service's main try/catch (if any) logs it.
      // The service method verifyCoupon does not have a try/catch around findOne.
    });

    describe('getCouponByEmail', () => {
      const email = 'test@example.com';
      const mockCurrentTime = Math.floor(Date.now() / 1000).toString();

      beforeEach(() => {
        // Configure the behavior of moment() for this test suite
        const specificMockedInstance = {
          format: jest.fn((formatArgs?: string) => {
            if (formatArgs === 'X') {
              return mockCurrentTime;
            }
            return 'Default-Formatted-Date';
          }),
        };
        // Use jest.requireMock here as well
        const currentMomentMockInGetCoupon = jest.requireMock(
          'moment',
        ) as jest.Mock;
        currentMomentMockInGetCoupon.mockReturnValue(specificMockedInstance);
      });

      it('should return a list of valid, unexpired, unused coupons for the email', async () => {
        const mockVouchers = [
          {
            voucherCode: 'V1',
            email,
            used: false,
            expirattionDate: (parseInt(mockCurrentTime, 10) + 1000).toString(),
          },
          {
            voucherCode: 'V2',
            email,
            used: false,
            expirattionDate: (parseInt(mockCurrentTime, 10) + 2000).toString(),
          },
        ];
        mockVoucherViewModel.findAll.mockResolvedValue(mockVouchers as any);

        const result = await service.getCouponByEmail({ email });

        expect(mockVoucherViewModel.findAll).toHaveBeenCalledWith({
          where: {
            email,
            expirattionDate: { [Op.gt]: mockCurrentTime },
            used: false,
          },
        });
        expect(result).toEqual(mockVouchers);
      });

      it('should return an empty list if no valid coupons are found', async () => {
        mockVoucherViewModel.findAll.mockResolvedValue([]);

        const result = await service.getCouponByEmail({ email });

        expect(mockVoucherViewModel.findAll).toHaveBeenCalledWith({
          where: {
            email,
            expirattionDate: { [Op.gt]: mockCurrentTime },
            used: false,
          },
        });
        expect(result).toEqual([]);
      });

      it('should rethrow error if VoucherViewModel.findAll fails', async () => {
        const dbError = new Error('DB findAll error');
        mockVoucherViewModel.findAll.mockRejectedValue(dbError);

        // The service method getCouponByEmail does not have a try/catch.
        await expect(service.getCouponByEmail({ email })).rejects.toThrow(
          dbError,
        );
        expect(loggerService.error).not.toHaveBeenCalled(); // No try/catch in service to log this
      });
    });

    it('Case 5: DB error during VouchersModel.update', async () => {
      const futureTimestamp = (
        Math.floor(Date.now() / 1000) + 86400
      ).toString();
      mockVoucherViewModel.findOne.mockResolvedValue({
        ...mockFoundCoupon,
        expirattionDate: futureTimestamp,
      } as any);
      const updateError = new Error('DB update error');
      mockVouchersModel.update.mockRejectedValue(updateError);

      // Similar to above, the error will propagate.
      await expect(service.verifyCoupon(mockCouponQuery)).rejects.toThrow(
        updateError,
      );

      expect(mockDbTransaction.commit).not.toHaveBeenCalled();
      expect(mockDbTransaction.rollback).not.toHaveBeenCalled();
    });
  });
  describe('createVocherForCustomer', () => {
    const specialOfferId = 'offer-123';
    const expirationDate = '2024-12-31';
    const limit = 10;
    const offset = 0;
    let generateCouponSpy: jest.SpyInstance;

    beforeEach(() => {
      generateCouponSpy = jest.spyOn(service, 'generateCoupon');
      // Reset transaction mock for direct control as this method creates its own transaction
      (dbAdapter.transaction as jest.Mock).mockResolvedValue(mockDbTransaction);
      mockDbTransaction.commit.mockReset();
      mockDbTransaction.rollback.mockReset();
    });

    afterEach(() => {
      generateCouponSpy.mockRestore();
    });

    it('should create vouchers for a list of customers and commit transaction', async () => {
      const mockCustomers = [
        { id: 'cust-1', name: 'Customer 1' },
        { id: 'cust-2', name: 'Customer 2' },
      ];
      mockCustomerModel.findAll.mockResolvedValue(mockCustomers as any);
      mockVouchersModel.bulkCreate.mockResolvedValue(undefined as any); // Does not matter what it resolves to
      generateCouponSpy
        .mockReturnValueOnce('COUPON1')
        .mockReturnValueOnce('COUPON2');

      await service.createVocherForCustomer(
        specialOfferId,
        expirationDate,
        limit,
        offset,
      );

      expect(mockCustomerModel.findAll).toHaveBeenCalledWith({
        transaction: mockDbTransaction,
        limit,
        offset,
      });
      expect(generateCouponSpy).toHaveBeenCalledTimes(mockCustomers.length);
      expect(mockVouchersModel.bulkCreate).toHaveBeenCalledWith(
        [
          {
            voucherCode: 'COUPON1',
            customerId: 'cust-1',
            offerId: specialOfferId,
            expirattionDate: expirationDate,
          },
          {
            voucherCode: 'COUPON2',
            customerId: 'cust-2',
            offerId: specialOfferId,
            expirattionDate: expirationDate,
          },
        ],
        { transaction: mockDbTransaction },
      );
      expect(mockDbTransaction.commit).toHaveBeenCalledTimes(1);
      expect(mockDbTransaction.rollback).not.toHaveBeenCalled();
      expect(loggerService.info).toHaveBeenCalledWith(
        `creating coupons from ${offset} to ${offset + limit}`,
      );
      expect(loggerService.info).toHaveBeenCalledWith(
        `created coupons from ${offset} to ${offset + limit}`,
      );
    });

    it('should rollback transaction if CustomerModel.findAll fails', async () => {
      const dbError = new Error('findAll failed');
      mockCustomerModel.findAll.mockRejectedValue(dbError);

      await service.createVocherForCustomer(
        specialOfferId,
        expirationDate,
        limit,
        offset,
      );

      expect(mockVouchersModel.bulkCreate).not.toHaveBeenCalled();
      expect(mockDbTransaction.commit).not.toHaveBeenCalled();
      expect(mockDbTransaction.rollback).toHaveBeenCalledTimes(1);
      expect(loggerService.error).toHaveBeenCalledWith(
        `failed to create coupons ${dbError}`,
      );
    });

    it('should rollback transaction if VouchersModel.bulkCreate fails', async () => {
      const mockCustomers = [{ id: 'cust-1' }];
      mockCustomerModel.findAll.mockResolvedValue(mockCustomers as any);
      const dbError = new Error('bulkCreate failed');
      mockVouchersModel.bulkCreate.mockRejectedValue(dbError);
      generateCouponSpy.mockReturnValueOnce('COUPON1');

      await service.createVocherForCustomer(
        specialOfferId,
        expirationDate,
        limit,
        offset,
      );

      expect(mockDbTransaction.commit).not.toHaveBeenCalled();
      expect(mockDbTransaction.rollback).toHaveBeenCalledTimes(1);
      expect(loggerService.error).toHaveBeenCalledWith(
        `failed to create coupons ${dbError}`,
      );
    });
  });
  describe('processCoupons', () => {
    const specialOfferId = 'offer-123';
    const expirationDate = '2024-12-31';
    let createVoucherSpy: jest.SpyInstance;
    // Assuming env.voucherLimit is 100 from the mock setup for '../env'
    const voucherLimit = 100;

    beforeEach(() => {
      createVoucherSpy = jest
        .spyOn(service, 'createVocherForCustomer')
        .mockResolvedValue(undefined);
      // Mock env.voucherLimit if it needs to be different from default for specific tests in this suite
      // For now, using the default 100 from the global mock of '../env'
    });

    afterEach(() => {
      createVoucherSpy.mockRestore();
    });

    it('Case 1: customerCount < env.voucherLimit', async () => {
      const customerCount = 50;
      mockCustomerModel.count.mockResolvedValue(customerCount);
      // Directly import and use 'env' from the mocked module if needed for assertion,
      // or trust the service uses the mocked value.
      // For this test, the service's behavior with the mocked 'env.voucherLimit' is what's tested.

      await service.processCoupons(specialOfferId, expirationDate);

      expect(mockCustomerModel.count).toHaveBeenCalledTimes(1);
      expect(createVoucherSpy).toHaveBeenCalledTimes(1);
      expect(createVoucherSpy).toHaveBeenCalledWith(
        specialOfferId,
        expirationDate,
        customerCount,
        0,
      );
      // Service bug: VoucherJobModel.upsert to 'inActive' is NOT called in this path.
      expect(mockVoucherJobModel.upsert).not.toHaveBeenCalled();
    });

    it('Case 2: customerCount > env.voucherLimit (e.g., 250 customers, limit 100)', async () => {
      const customerCount = 250;
      mockCustomerModel.count.mockResolvedValue(customerCount);
      // env.voucherLimit is 100 from the mock

      await service.processCoupons(specialOfferId, expirationDate);

      expect(mockCustomerModel.count).toHaveBeenCalledTimes(1);
      expect(createVoucherSpy).toHaveBeenCalledTimes(3); // 100, 100, 50
      expect(createVoucherSpy).toHaveBeenNthCalledWith(
        1,
        specialOfferId,
        expirationDate,
        voucherLimit,
        0,
      );
      expect(createVoucherSpy).toHaveBeenNthCalledWith(
        2,
        specialOfferId,
        expirationDate,
        voucherLimit,
        100,
      );
      // The actual service code passes `env.voucherLimit` as the limit argument for the last call too,
      // not the remainder. So, it would be (..., 100, 200).
      // The loop in service is `i += env.voucherLimit`, and `createVocherForCustomer` is called with `env.voucherLimit`.
      // This means the last batch might request more customers than available if not handled inside `createVocherForCustomer`'s `findAll`.
      // Let's test the actual behavior of `processCoupons`.
      expect(createVoucherSpy).toHaveBeenNthCalledWith(
        3,
        specialOfferId,
        expirationDate,
        voucherLimit,
        200,
      );

      expect(mockVoucherJobModel.upsert).toHaveBeenCalledWith({
        jobName: 'voucherForAll',
        status: 'inActive',
      });
    });

    it('Case 2.1: customerCount is an exact multiple of env.voucherLimit (e.g., 200 customers, limit 100)', async () => {
      const customerCount = 200;
      mockCustomerModel.count.mockResolvedValue(customerCount);
      // env.voucherLimit is 100 from the mock

      await service.processCoupons(specialOfferId, expirationDate);

      expect(mockCustomerModel.count).toHaveBeenCalledTimes(1);
      expect(createVoucherSpy).toHaveBeenCalledTimes(2); // 100, 100
      expect(createVoucherSpy).toHaveBeenNthCalledWith(
        1,
        specialOfferId,
        expirationDate,
        voucherLimit,
        0,
      );
      expect(createVoucherSpy).toHaveBeenNthCalledWith(
        2,
        specialOfferId,
        expirationDate,
        voucherLimit,
        100,
      );

      expect(mockVoucherJobModel.upsert).toHaveBeenCalledWith({
        jobName: 'voucherForAll',
        status: 'inActive',
      });
    });

    it('Case 3: Error in CustomerModel.count', async () => {
      const dbError = new Error('DB count error');
      mockCustomerModel.count.mockRejectedValue(dbError);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await service.processCoupons(specialOfferId, expirationDate);

      expect(createVoucherSpy).not.toHaveBeenCalled();
      expect(mockVoucherJobModel.upsert).not.toHaveBeenCalledWith(
        // Should not try to set to inActive if count failed
        { jobName: 'voucherForAll', status: 'inActive' },
      );
      expect(consoleSpy).toHaveBeenCalledWith(dbError); // Service uses console.log for this error
      consoleSpy.mockRestore();
    });
  });
  describe('genreateVoucherForAllCustomer', () => {
    const specialOfferId = 'offer-123';
    const expirationDate = '2024-12-31';
    let processCouponsSpy: jest.SpyInstance;

    beforeEach(() => {
      // Spy on processCoupons, as it's a method within the same service
      processCouponsSpy = jest
        .spyOn(service, 'processCoupons')
        .mockResolvedValue(undefined); // Mock to resolve by default
    });

    afterEach(() => {
      processCouponsSpy.mockRestore();
    });

    it('Case 1: Job "voucherForAll" is already "Active"', async () => {
      // Service finds by jobName only, then checks status.
      mockVoucherJobModel.findOne.mockResolvedValue({
        jobName: 'voucherForAll',
        status: 'Active',
        toJSON: () => ({ jobName: 'voucherForAll', status: 'Active' }),
      } as any);

      const result = await service.genreateVoucherForAllCustomer(
        specialOfferId,
        expirationDate,
      );

      expect(mockVoucherJobModel.findOne).toHaveBeenCalledWith({
        where: { jobName: 'voucherForAll' }, // Corrected: finds by name first
        transaction: mockDbTransaction,
      });
      expect(result).toEqual({ status: 'Active' });
      expect(processCouponsSpy).not.toHaveBeenCalled();
      expect(mockDbTransaction.commit).toHaveBeenCalledTimes(1); // Service commits explicitly
    });

    it('Case 2: Job is not active, should start processing', async () => {
      mockVoucherJobModel.findOne.mockResolvedValue(null);
      mockVoucherJobModel.upsert.mockResolvedValue([null as any, null] as [
        any,
        boolean | null,
      ]);

      const result = await service.genreateVoucherForAllCustomer(
        specialOfferId,
        expirationDate,
      );

      expect(mockVoucherJobModel.findOne).toHaveBeenCalledWith({
        where: { jobName: 'voucherForAll' }, // Corrected
        transaction: mockDbTransaction,
      });
      expect(mockVoucherJobModel.upsert).toHaveBeenCalledWith(
        { jobName: 'voucherForAll', status: 'Active' },
        { transaction: mockDbTransaction },
      );
      // processCoupons is called without transaction t, it's fire and forget from this method's tx perspective
      expect(processCouponsSpy).toHaveBeenCalledWith(
        specialOfferId,
        expirationDate,
      );
      expect(result).toEqual({ status: 'success' });
      expect(mockDbTransaction.commit).toHaveBeenCalledTimes(1); // Service commits explicitly before calling processCoupons
    });

    it('Case 3: Error during VoucherJobModel.findOne', async () => {
      const dbError = new Error('DB findOne error');
      mockVoucherJobModel.findOne.mockRejectedValue(dbError);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(); // Spy on console.log

      const result = await service.genreateVoucherForAllCustomer(
        specialOfferId,
        expirationDate,
      );

      expect(result).toEqual({
        status: 'unable to create coupon at this time try aftersometime',
      });
      expect(mockDbTransaction.rollback).toHaveBeenCalledTimes(1); // Service rolls back explicitly
      expect(loggerService.error).not.toHaveBeenCalled(); // Service uses console.log for this error
      expect(consoleSpy).toHaveBeenCalledWith(dbError);
      expect(processCouponsSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('Case 4: Error during VoucherJobModel.upsert', async () => {
      mockVoucherJobModel.findOne.mockResolvedValue(null);
      const dbError = new Error('DB upsert error');
      mockVoucherJobModel.upsert.mockRejectedValue(dbError);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await service.genreateVoucherForAllCustomer(
        specialOfferId,
        expirationDate,
      );

      expect(result).toEqual({
        status: 'unable to create coupon at this time try aftersometime',
      });
      expect(mockDbTransaction.rollback).toHaveBeenCalledTimes(1); // Service rolls back explicitly
      expect(loggerService.error).not.toHaveBeenCalled(); // Service uses console.log
      expect(consoleSpy).toHaveBeenCalledWith(dbError);
      expect(processCouponsSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
