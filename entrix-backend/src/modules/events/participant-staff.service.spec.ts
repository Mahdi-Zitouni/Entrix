import { Test, TestingModule } from '@nestjs/testing';
import { ParticipantStaffService } from './participant-staff.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ParticipantStaff } from './participant-staff.entity';

describe('ParticipantStaffService', () => {
  let service: ParticipantStaffService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParticipantStaffService,
        {
          provide: getRepositoryToken(ParticipantStaff),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ParticipantStaffService>(ParticipantStaffService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
}); 