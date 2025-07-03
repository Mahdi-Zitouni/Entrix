import { Test, TestingModule } from '@nestjs/testing';
import { SecurityEventController } from './security-event.controller';
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

describe('SecurityEventController', () => {
  let controller: SecurityEventController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SecurityEventController],
      providers: [
        SecurityEventService,
        {
          provide: getRepositoryToken(SecurityEvent),
          useValue: mockRepository,
        },
      ],
    }).compile();

    controller = module.get<SecurityEventController>(SecurityEventController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
