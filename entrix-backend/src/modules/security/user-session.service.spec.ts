import { Test, TestingModule } from '@nestjs/testing';
import { UserSessionService } from './user-session.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserSession } from './user-session.entity';

const mockRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

describe('UserSessionService', () => {
  let service: UserSessionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserSessionService,
        {
          provide: getRepositoryToken(UserSession),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserSessionService>(UserSessionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
