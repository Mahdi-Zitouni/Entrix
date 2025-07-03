import { Test, TestingModule } from '@nestjs/testing';
import { UserSessionController } from './user-session.controller';
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

describe('UserSessionController', () => {
  let controller: UserSessionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserSessionController],
      providers: [
        UserSessionService,
        {
          provide: getRepositoryToken(UserSession),
          useValue: mockRepository,
        },
      ],
    }).compile();

    controller = module.get<UserSessionController>(UserSessionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
