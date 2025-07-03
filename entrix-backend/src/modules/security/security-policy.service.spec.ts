import { Test, TestingModule } from '@nestjs/testing';
import { SecurityPolicyService } from './security-policy.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SecurityPolicy } from './security-policy.entity';

const mockRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
};

describe('SecurityPolicyService', () => {
  let service: SecurityPolicyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityPolicyService,
        {
          provide: getRepositoryToken(SecurityPolicy),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SecurityPolicyService>(SecurityPolicyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
