import { Test, TestingModule } from '@nestjs/testing';
import { ParticipantStaffController } from './participant-staff.controller';
import { ParticipantStaffService } from './participant-staff.service';

describe('ParticipantStaffController', () => {
  let controller: ParticipantStaffController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ParticipantStaffController],
      providers: [
        {
          provide: ParticipantStaffService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<ParticipantStaffController>(ParticipantStaffController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
}); 