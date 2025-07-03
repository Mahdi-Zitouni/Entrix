import { Test, TestingModule } from '@nestjs/testing';
import { MfaTokenController } from './mfa-token.controller';
import { MfaTokenService } from './mfa-token.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MfaToken } from './mfa-token.entity';

const mockRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

describe('MfaTokenController', () => {
  let controller: MfaTokenController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MfaTokenController],
      providers: [
        MfaTokenService,
        {
          provide: getRepositoryToken(MfaToken),
          useValue: mockRepository,
        },
      ],
    }).compile();

    controller = module.get<MfaTokenController>(MfaTokenController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
