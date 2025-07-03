import { Test, TestingModule } from '@nestjs/testing';
import { EventRestrictionService } from './event-restriction.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventRestriction } from './event-restriction.entity';

describe('EventRestrictionService', () => {
  let service: EventRestrictionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventRestrictionService,
        {
          provide: getRepositoryToken(EventRestriction),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<EventRestrictionService>(EventRestrictionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
}); 