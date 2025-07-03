import { Test, TestingModule } from '@nestjs/testing';
import { SecurityPolicyController } from './security-policy.controller';
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

describe('SecurityPolicyController', () => {
  let controller: SecurityPolicyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SecurityPolicyController],
      providers: [
        SecurityPolicyService,
        {
          provide: getRepositoryToken(SecurityPolicy),
          useValue: mockRepository,
        },
      ],
    }).compile();

    controller = module.get<SecurityPolicyController>(SecurityPolicyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
