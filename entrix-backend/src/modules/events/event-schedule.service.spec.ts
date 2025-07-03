import { Test, TestingModule } from '@nestjs/testing';
import { EventScheduleService } from './event-schedule.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventSchedule } from './event-schedule.entity';

describe('EventScheduleService', () => {
  let service: EventScheduleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventScheduleService,
        {
          provide: getRepositoryToken(EventSchedule),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<EventScheduleService>(EventScheduleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
}); 