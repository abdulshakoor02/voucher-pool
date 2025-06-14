
import { Test, TestingModule } from '@nestjs/testing';
import { CustomerController } from './customer.controller';
import { LoggerService } from '../logger/logger.service';
import { CustomerModel, ICustomerModel } from '../customer/interfaces/customer.interface'; // Adjusted import
import { InternalServerErrorException } from '@nestjs/common';

// Actual CustomerModel is a Sequelize model with static methods.
// We will spy on its static 'create' method.

describe('CustomerController', () => {
  let controller: CustomerController;
  let loggerService: LoggerService;
  let customerModelCreateSpy: jest.SpyInstance;

  // Mock for the LoggerService injected into CustomerController
  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    info: jest.fn(), // Added info as it's used by model hooks, though not directly tested here
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerController],
      providers: [
        { provide: LoggerService, useValue: mockLoggerService },
        // No need to provide CustomerModel here as we are spying on its static methods
      ],
    }).compile();

    controller = module.get<CustomerController>(CustomerController);
    loggerService = module.get<LoggerService>(LoggerService);

    // Spy on the static 'create' method of CustomerModel
    // The implementation of CustomerModel.create comes from Sequelize, so we mock its return value.
    customerModelCreateSpy = jest.spyOn(CustomerModel, 'create');
    
    // Reset mocks before each test
    mockLoggerService.error.mockClear();
    mockLoggerService.log.mockClear();
    customerModelCreateSpy.mockClear();
  });

  afterEach(() => {
    // Restore the original implementation after each test
    customerModelCreateSpy.mockRestore();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('CreateCustomer', () => {
    const customerData = {
      name: 'Test Customer',
      email: 'test@example.com',
      // dob: new Date('1990-01-01'), // dob is not in CustomerDto or CustomerModel
    };
    // Define a structure that matches what CustomerModel.create might return
    const createdCustomerMock: ICustomerModel = {
      id: 'mock-uuid-123',
      ...customerData,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null, // or undefined, depending on Sequelize model
      // Sequelize model methods that are not part of the data structure
      reload: jest.fn(),
      save: jest.fn(),
      destroy: jest.fn(),
      update: jest.fn(),
      set: jest.fn(),
      get: jest.fn(),
      increment: jest.fn(),
      decrement: jest.fn(),
      validate: jest.fn(),
      toJSON: jest.fn(() => ({ id: 'mock-uuid-123', ...customerData, createdAt: new Date(), updatedAt: new Date() })),
    } as unknown as ICustomerModel;


    it('should create a customer successfully', async () => {
      customerModelCreateSpy.mockResolvedValue(createdCustomerMock);

      const result = await controller.CreateCustomer(customerData);

      expect(CustomerModel.create).toHaveBeenCalledWith(customerData);
      // The controller returns the direct result from CustomerModel.create
      expect(result).toEqual(createdCustomerMock); 
      // Controller does not log on success
      expect(mockLoggerService.log).not.toHaveBeenCalled();
      expect(mockLoggerService.error).not.toHaveBeenCalled();
    });

    it('should handle errors during customer creation and throw InternalServerErrorException', async () => {
      const errorMessage = 'Database connection error';
      const error = new Error(errorMessage);
      customerModelCreateSpy.mockRejectedValue(error);

      await expect(controller.CreateCustomer(customerData)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(CustomerModel.create).toHaveBeenCalledWith(customerData);
      // Check if the loggerService.error was called with the correct message
      // The controller logs: `failed to create user ${error}`
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        `failed to create user ${error}`,
      );
    });
  });
});
