import { Test, TestingModule } from '@nestjs/testing';
import { SecurityEventService } from './security-event.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SecurityEvent } from './security-event.entity';

const mockRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

describe('SecurityEventService', () => {
  let service: SecurityEventService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityEventService,
        {
          provide: getRepositoryToken(SecurityEvent),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SecurityEventService>(SecurityEventService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
