import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventSchedule } from './event-schedule.entity';
import { CreateEventScheduleDto } from './dto/create-event-schedule.dto';
import { UpdateEventScheduleDto } from './dto/update-event-schedule.dto';

@Injectable()
export class EventScheduleService {
  private readonly logger = new Logger(EventScheduleService.name);

  constructor(
    @InjectRepository(EventSchedule)
    private readonly eventScheduleRepository: Repository<EventSchedule>,
  ) {}

  create(dto: CreateEventScheduleDto) {
    this.logger.log(`Creating event schedule for event ${dto.eventId}`);
    const schedule = this.eventScheduleRepository.create(dto);
    return this.eventScheduleRepository.save(schedule);
  }

  findAll() {
    return this.eventScheduleRepository.find();
  }

  findOne(id: string) {
    return this.eventScheduleRepository.findOne({ where: { id } });
  }

  update(id: string, dto: UpdateEventScheduleDto) {
    this.logger.log(`Updating event schedule ${id}`);
    return this.eventScheduleRepository.update(id, dto);
  }

  remove(id: string) {
    this.logger.log(`Deleting event schedule ${id}`);
    return this.eventScheduleRepository.delete(id);
  }

  // Add business logic methods as needed
} 