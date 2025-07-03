import { Test, TestingModule } from '@nestjs/testing';
import { LoginAttemptService } from './login-attempt.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LoginAttempt } from './login-attempt.entity';

const mockRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

describe('LoginAttemptService', () => {
  let service: LoginAttemptService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginAttemptService,
        {
          provide: getRepositoryToken(LoginAttempt),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<LoginAttemptService>(LoginAttemptService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
