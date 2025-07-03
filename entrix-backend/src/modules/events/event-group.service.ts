import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventGroup } from './event-group.entity';
import { CreateEventGroupDto } from './dto/create-event-group.dto';
import { UpdateEventGroupDto } from './dto/update-event-group.dto';

@Injectable()
export class EventGroupService {
  constructor(
    @InjectRepository(EventGroup)
    private readonly eventGroupRepository: Repository<EventGroup>,
  ) {}

  async findAll(): Promise<EventGroup[]> {
    return this.eventGroupRepository.find();
  }

  async findOne(id: string): Promise<EventGroup> {
    const group = await this.eventGroupRepository.findOne({ where: { id } });
    if (!group) throw new NotFoundException('Event group not found');
    return group;
  }

  async create(createDto: CreateEventGroupDto): Promise<EventGroup> {
    const group = this.eventGroupRepository.create(createDto);
    return this.eventGroupRepository.save(group);
  }

  async update(
    id: string,
    updateDto: UpdateEventGroupDto,
  ): Promise<EventGroup> {
    const group = await this.findOne(id);
    Object.assign(group, updateDto);
    return this.eventGroupRepository.save(group);
  }

  async remove(id: string): Promise<void> {
    const group = await this.findOne(id);
    await this.eventGroupRepository.remove(group);
  }
}
