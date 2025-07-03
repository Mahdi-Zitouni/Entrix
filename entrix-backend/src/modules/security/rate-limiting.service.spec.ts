import { Test, TestingModule } from '@nestjs/testing';
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

describe('RateLimitingService', () => {
  let service: RateLimitingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitingService,
        {
          provide: getRepositoryToken(RateLimiting),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<RateLimitingService>(RateLimitingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
