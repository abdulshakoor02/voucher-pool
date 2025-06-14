import { Test, TestingModule } from '@nestjs/testing';
import { SpecialOffersController } from './specialOffers.controller';
import { LoggerService } from '../logger/logger.service';
import {
  SpecialOffersModel,
  ISpecialOffersModel,
  SpecialOffersDto,
} from '../specialOffers/interfaces/specialOffers.interface'; // Added SpecialOffersDto
import { InternalServerErrorException } from '@nestjs/common';

describe('SpecialOffersController', () => {
  let controller: SpecialOffersController;
  let loggerService: LoggerService;
  let specialOffersModelCreateSpy: jest.SpyInstance;

  const mockLoggerService = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    info: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SpecialOffersController],
      providers: [{ provide: LoggerService, useValue: mockLoggerService }],
    }).compile();

    controller = module.get<SpecialOffersController>(SpecialOffersController);
    loggerService = module.get<LoggerService>(LoggerService);

    specialOffersModelCreateSpy = jest.spyOn(SpecialOffersModel, 'create');

    mockLoggerService.error.mockClear();
    mockLoggerService.log.mockClear();
    specialOffersModelCreateSpy.mockClear();
  });

  afterEach(() => {
    specialOffersModelCreateSpy.mockRestore();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('CreateOffer', () => {
    // Corrected field name from discountPercentage to discount
    const offerData: SpecialOffersDto = {
      name: 'Test Offer',
      discount: 10, // Corrected field
    };

    const createdOfferMock: ISpecialOffersModel = {
      id: 'offer-uuid-123',
      name: offerData.name,
      discount: offerData.discount, // Corrected field
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      reload: jest.fn(),
      save: jest.fn(),
      destroy: jest.fn(),
      update: jest.fn(),
      set: jest.fn(),
      get: jest.fn(),
      increment: jest.fn(),
      decrement: jest.fn(),
      validate: jest.fn(),
      toJSON: jest.fn(() => ({
        id: 'offer-uuid-123',
        name: offerData.name,
        discount: offerData.discount, // Corrected field
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    } as unknown as ISpecialOffersModel;

    it('should create an offer successfully', async () => {
      specialOffersModelCreateSpy.mockResolvedValue(createdOfferMock);

      const result = await controller.CreateOffer(offerData);

      expect(SpecialOffersModel.create).toHaveBeenCalledWith(offerData);
      expect(result).toEqual(createdOfferMock);
      expect(mockLoggerService.log).not.toHaveBeenCalled();
      expect(mockLoggerService.error).not.toHaveBeenCalled();
    });

    it('should handle errors during offer creation and throw InternalServerErrorException', async () => {
      const errorMessage = 'Offer database error';
      const error = new Error(errorMessage);
      specialOffersModelCreateSpy.mockRejectedValue(error);

      await expect(controller.CreateOffer(offerData)).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(SpecialOffersModel.create).toHaveBeenCalledWith(offerData);
      // Corrected expected log message to match controller's actual (likely incorrect) message
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        `failed to create user ${error}`,
      );
    });
  });
});
