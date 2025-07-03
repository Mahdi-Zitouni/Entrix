import { Test, TestingModule } from '@nestjs/testing';
import { RateLimitingController } from './rate-limiting.controller';
import { RateLimitingService } from './rate-limiting.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RateLimiting } from './rate-limiting.entity';

const mockRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

describe('RateLimitingController', () => {
  let controller: RateLimitingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RateLimitingController],
      providers: [
        RateLimitingService,
        {
          provide: getRepositoryToken(RateLimiting),
          useValue: mockRepository,
        },
      ],
    }).compile();

    controller = module.get<RateLimitingController>(RateLimitingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
