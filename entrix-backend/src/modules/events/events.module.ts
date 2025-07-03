import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from './event.entity';
import { EventGroup } from './event-group.entity';
import { EventCategory } from './event-category.entity';
import { EventMedia } from './event-media.entity';
import { EventStats } from './event-stats.entity';
import { EventParticipant } from './event-participant.entity';
import { Participant } from './participant.entity';
import { ParticipantRelationship } from './participant-relationship.entity';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { EventGroupService } from './event-group.service';
import { EventGroupController } from './event-group.controller';
import { EventCategoryService } from './event-category.service';
import { EventCategoryController } from './event-category.controller';
import { EventMediaService } from './event-media.service';
import { EventMediaController } from './event-media.controller';
import { EventStatsService } from './event-stats.service';
import { EventStatsController } from './event-stats.controller';
import { EventParticipantService } from './event-participant.service';
import { EventParticipantController } from './event-participant.controller';
import { ParticipantService } from './participant.service';
import { ParticipantController } from './participant.controller';
import { ParticipantRelationshipService } from './participant-relationship.service';
import { ParticipantRelationshipController } from './participant-relationship.controller';
import { ParticipantStaffModule } from './participant-staff.module';
import { EventScheduleModule } from './event-schedule.module';
import { EventRestrictionModule } from './event-restriction.module';
import { Ticket } from '../ticketing/ticket.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Event,
      EventGroup,
      EventCategory,
      EventMedia,
      EventStats,
      EventParticipant,
      Participant,
      ParticipantRelationship,
      Ticket,
    ]),
    ParticipantStaffModule,
    EventScheduleModule,
    EventRestrictionModule,
  ],
  providers: [
    EventsService,
    EventGroupService,
    EventCategoryService,
    EventMediaService,
    EventStatsService,
    EventParticipantService,
    ParticipantService,
    ParticipantRelationshipService,
  ],
  controllers: [
    EventsController,
    EventGroupController,
    EventCategoryController,
    EventMediaController,
    EventStatsController,
    EventParticipantController,
    ParticipantController,
    ParticipantRelationshipController,
  ],
  exports: [
    ParticipantStaffModule,
    EventScheduleModule,
    EventRestrictionModule,
    EventStatsService,
  ],
})
export class EventsModule {}
