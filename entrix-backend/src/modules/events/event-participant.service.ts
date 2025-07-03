import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventParticipant } from './event-participant.entity';
import { CreateEventParticipantDto } from './dto/create-event-participant.dto';
import { UpdateEventParticipantDto } from './dto/update-event-participant.dto';

@Injectable()
export class EventParticipantService {
  constructor(
    @InjectRepository(EventParticipant)
    private readonly eventParticipantRepository: Repository<EventParticipant>,
  ) {}

  async findAll(): Promise<EventParticipant[]> {
    return this.eventParticipantRepository.find();
  }

  async findOne(id: string): Promise<EventParticipant> {
    const participant = await this.eventParticipantRepository.findOne({
      where: { id },
    });
    if (!participant)
      throw new NotFoundException('Event participant not found');
    return participant;
  }

  async create(
    createDto: CreateEventParticipantDto,
  ): Promise<EventParticipant> {
    const participant = this.eventParticipantRepository.create(createDto);
    return this.eventParticipantRepository.save(participant);
  }

  async update(
    id: string,
    updateDto: UpdateEventParticipantDto,
  ): Promise<EventParticipant> {
    const participant = await this.findOne(id);
    Object.assign(participant, updateDto);
    return this.eventParticipantRepository.save(participant);
  }

  async remove(id: string): Promise<void> {
    const participant = await this.findOne(id);
    await this.eventParticipantRepository.remove(participant);
  }
}
