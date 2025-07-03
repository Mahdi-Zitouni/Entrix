import { Test, TestingModule } from '@nestjs/testing';
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

describe('MfaTokenService', () => {
  let service: MfaTokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MfaTokenService,
        {
          provide: getRepositoryToken(MfaToken),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<MfaTokenService>(MfaTokenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
