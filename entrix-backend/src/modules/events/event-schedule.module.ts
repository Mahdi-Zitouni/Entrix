import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventSchedule } from './event-schedule.entity';
import { EventScheduleService } from './event-schedule.service';
import { EventScheduleController } from './event-schedule.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EventSchedule])],
  providers: [EventScheduleService],
  controllers: [EventScheduleController],
  exports: [EventScheduleService],
})
export class EventScheduleModule {} 