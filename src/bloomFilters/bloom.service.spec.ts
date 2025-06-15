import { Test, TestingModule } from '@nestjs/testing';
import { BloomFilterService } from './bloom.service';
import { LoggerService } from '../logger/logger.service';
import { VouchersModel } from '../voucher/interfaces';
import { BloomFilter } from 'bloom-filters'; // This will be the mocked version

jest.mock('../logger/logger.service');

jest.mock('../voucher/interfaces', () => ({
  VouchersModel: {
    findAll: jest.fn(),
  },
}));

const mockBloomFilterInstance = {
  add: jest.fn(),
  has: jest.fn(),
};

jest.mock('bloom-filters', () => ({
  BloomFilter: {
    create: jest.fn(),
  },
}));

describe('BloomFilterService', () => {
  let service: BloomFilterService;
  let loggerService: jest.Mocked<LoggerService>;
  let mockVouchersModelFindAll: jest.Mock;
  let mockFilterCreate: jest.Mock; // This will be BloomFilter.create

  beforeEach(async () => {
    (BloomFilter.create as jest.Mock).mockReturnValue(mockBloomFilterInstance);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BloomFilterService,
        LoggerService, // LoggerService is auto-mocked by jest.mock at the top
      ],
    }).compile();

    service = module.get<BloomFilterService>(BloomFilterService);
    loggerService = module.get(LoggerService);

    mockVouchersModelFindAll = VouchersModel.findAll as jest.Mock;
    mockFilterCreate = BloomFilter.create as jest.Mock; // Get the mock for BloomFilter.create

    mockVouchersModelFindAll.mockReset();
    mockBloomFilterInstance.add.mockReset();
    mockBloomFilterInstance.has.mockReset();
    (BloomFilter.create as jest.Mock).mockReset();
    (BloomFilter.create as jest.Mock).mockReturnValue(mockBloomFilterInstance);

    loggerService.info.mockReset();
    loggerService.error.mockReset();
    loggerService.warn.mockReset();
    loggerService.debug.mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should initialize the filter and load existing codes', async () => {
      const mockVouchers = [{ voucherCode: 'CODE1' }, { voucherCode: 'CODE2' }];
      mockVouchersModelFindAll.mockResolvedValue(mockVouchers);

      await service.onModuleInit();

      expect(BloomFilter.create).toHaveBeenCalledTimes(1);
      expect(BloomFilter.create).toHaveBeenCalledWith(1000000, 0.01);
      expect(mockVouchersModelFindAll).toHaveBeenCalledTimes(1);
      expect(mockVouchersModelFindAll).toHaveBeenCalledWith(); // Corrected: No arguments
      expect(mockBloomFilterInstance.add).toHaveBeenCalledTimes(2);
      expect(mockBloomFilterInstance.add).toHaveBeenCalledWith('CODE1');
      expect(mockBloomFilterInstance.add).toHaveBeenCalledWith('CODE2');
      expect(loggerService.info).toHaveBeenCalledWith(
        '✅ Bloom filter loaded with 2 entries',
      );
    });

    it('should handle zero existing codes during initialization', async () => {
      mockVouchersModelFindAll.mockResolvedValue([]);

      await service.onModuleInit();

      expect(mockFilterCreate).toHaveBeenCalledTimes(1);
      expect(mockFilterCreate).toHaveBeenCalledWith(1000000, 0.01);
      expect(mockVouchersModelFindAll).toHaveBeenCalledTimes(1);
      expect(mockBloomFilterInstance.add).not.toHaveBeenCalled();
      expect(loggerService.info).toHaveBeenCalledWith(
        '✅ Bloom filter loaded with 0 entries',
      );
    });

    it('should throw error if VouchersModel.findAll fails during initialization', async () => {
      const dbError = new Error('DB findAll error');
      mockVouchersModelFindAll.mockRejectedValue(dbError);

      await expect(service.onModuleInit()).rejects.toThrow(dbError);

      expect(BloomFilter.create).toHaveBeenCalledTimes(1); // Filter is created before findAll
      expect(mockVouchersModelFindAll).toHaveBeenCalledTimes(1);
      expect(mockBloomFilterInstance.add).not.toHaveBeenCalled();
      // No specific error log in the service for this, error propagates
      expect(loggerService.error).not.toHaveBeenCalled();
      expect(loggerService.info).not.toHaveBeenCalledWith(
        expect.stringContaining('Bloom filter loaded'),
      );
    });
  });

  describe('add', () => {
    it('should call the underlying filter add method if filter is initialized', async () => {
      // Initialize the filter by calling onModuleInit
      mockVouchersModelFindAll.mockResolvedValue([]); // Assume no initial codes for simplicity
      await service.onModuleInit();
      // Reset add mock as onModuleInit might call it if there were codes
      mockBloomFilterInstance.add.mockReset();

      service.add('NEWCODE');

      expect(mockBloomFilterInstance.add).toHaveBeenCalledTimes(1);
      expect(mockBloomFilterInstance.add).toHaveBeenCalledWith('NEWCODE');
    });

    it('should throw an error if filter is not initialized', () => {
      expect(() => service.add('NEWCODE')).toThrow(TypeError); // Expecting "Cannot read properties of undefined (reading 'add')"
      expect(mockBloomFilterInstance.add).not.toHaveBeenCalled();
      expect(loggerService.error).not.toHaveBeenCalled(); // No specific log for this in service
    });
  });

  describe('has', () => {
    it('should call the underlying filter has method and return its result if filter is initialized', async () => {
      mockVouchersModelFindAll.mockResolvedValue([]);
      await service.onModuleInit();

      mockBloomFilterInstance.has.mockReturnValue(true);
      let result = service.has('TESTCODE');
      expect(mockBloomFilterInstance.has).toHaveBeenCalledTimes(1);
      expect(mockBloomFilterInstance.has).toHaveBeenCalledWith('TESTCODE');
      expect(result).toBe(true);

      mockBloomFilterInstance.has.mockReturnValue(false);
      result = service.has('ANOTHERCODE');
      // has been called once above, now a second time
      expect(mockBloomFilterInstance.has).toHaveBeenCalledTimes(2);
      expect(mockBloomFilterInstance.has).toHaveBeenNthCalledWith(
        2,
        'ANOTHERCODE',
      );
      expect(result).toBe(false);
    });

    it('should throw an error if filter is not initialized', () => {
      // Do not call onModuleInit
      expect(() => service.has('TESTCODE')).toThrow(TypeError); // Expecting "Cannot read properties of undefined (reading 'has')"
      expect(mockBloomFilterInstance.has).not.toHaveBeenCalled();
      expect(loggerService.error).not.toHaveBeenCalled(); // No specific log for this in service
    });
  });
});
