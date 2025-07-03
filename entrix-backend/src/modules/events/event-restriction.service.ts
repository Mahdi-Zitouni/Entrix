import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventRestriction } from './event-restriction.entity';
import { CreateEventRestrictionDto } from './dto/create-event-restriction.dto';
import { UpdateEventRestrictionDto } from './dto/update-event-restriction.dto';

@Injectable()
export class EventRestrictionService {
  private readonly logger = new Logger(EventRestrictionService.name);

  constructor(
    @InjectRepository(EventRestriction)
    private readonly eventRestrictionRepository: Repository<EventRestriction>,
  ) {}

  create(dto: CreateEventRestrictionDto) {
    this.logger.log(`Creating event restriction for event ${dto.eventId}`);
    const restriction = this.eventRestrictionRepository.create(dto);
    return this.eventRestrictionRepository.save(restriction);
  }

  findAll() {
    return this.eventRestrictionRepository.find();
  }

  findOne(id: string) {
    return this.eventRestrictionRepository.findOne({ where: { id } });
  }

  update(id: string, dto: UpdateEventRestrictionDto) {
    this.logger.log(`Updating event restriction ${id}`);
    return this.eventRestrictionRepository.update(id, dto);
  }

  remove(id: string) {
    this.logger.log(`Deleting event restriction ${id}`);
    return this.eventRestrictionRepository.delete(id);
  }

  // Add business logic methods as needed
} 