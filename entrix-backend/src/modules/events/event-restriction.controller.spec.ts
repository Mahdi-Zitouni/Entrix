import { Test, TestingModule } from '@nestjs/testing';
import { EventRestrictionController } from './event-restriction.controller';
import { EventRestrictionService } from './event-restriction.service';

describe('EventRestrictionController', () => {
  let controller: EventRestrictionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventRestrictionController],
      providers: [
        {
          provide: EventRestrictionService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<EventRestrictionController>(EventRestrictionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
}); 