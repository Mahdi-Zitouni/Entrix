import { Test, TestingModule } from '@nestjs/testing';
import { LoginAttemptController } from './login-attempt.controller';
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

describe('LoginAttemptController', () => {
  let controller: LoginAttemptController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LoginAttemptController],
      providers: [
        LoginAttemptService,
        {
          provide: getRepositoryToken(LoginAttempt),
          useValue: mockRepository,
        },
      ],
    }).compile();

    controller = module.get<LoginAttemptController>(LoginAttemptController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
