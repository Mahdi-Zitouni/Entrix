import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventCategory } from './event-category.entity';
import { CreateEventCategoryDto } from './dto/create-event-category.dto';
import { UpdateEventCategoryDto } from './dto/update-event-category.dto';

@Injectable()
export class EventCategoryService {
  constructor(
    @InjectRepository(EventCategory)
    private readonly eventCategoryRepository: Repository<EventCategory>,
  ) {}

  async findAll(): Promise<EventCategory[]> {
    return this.eventCategoryRepository.find();
  }

  async findOne(id: string): Promise<EventCategory> {
    const category = await this.eventCategoryRepository.findOne({
      where: { id },
    });
    if (!category) throw new NotFoundException('Event category not found');
    return category;
  }

  async create(createDto: CreateEventCategoryDto): Promise<EventCategory> {
    const category = this.eventCategoryRepository.create(createDto);
    return this.eventCategoryRepository.save(category);
  }

  async update(
    id: string,
    updateDto: UpdateEventCategoryDto,
  ): Promise<EventCategory> {
    const category = await this.findOne(id);
    Object.assign(category, updateDto);
    return this.eventCategoryRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    await this.eventCategoryRepository.remove(category);
  }
}
