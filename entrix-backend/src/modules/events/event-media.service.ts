import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventMedia } from './event-media.entity';
import { CreateEventMediaDto } from './dto/create-event-media.dto';
import { UpdateEventMediaDto } from './dto/update-event-media.dto';

@Injectable()
export class EventMediaService {
  constructor(
    @InjectRepository(EventMedia)
    private readonly eventMediaRepository: Repository<EventMedia>,
  ) {}

  async findAll(): Promise<EventMedia[]> {
    return this.eventMediaRepository.find();
  }

  async findOne(id: string): Promise<EventMedia> {
    const media = await this.eventMediaRepository.findOne({ where: { id } });
    if (!media) throw new NotFoundException('Event media not found');
    return media;
  }

  async create(createDto: CreateEventMediaDto): Promise<EventMedia> {
    const media = this.eventMediaRepository.create(createDto);
    return this.eventMediaRepository.save(media);
  }

  async update(
    id: string,
    updateDto: UpdateEventMediaDto,
  ): Promise<EventMedia> {
    const media = await this.findOne(id);
    Object.assign(media, updateDto);
    return this.eventMediaRepository.save(media);
  }

  async remove(id: string): Promise<void> {
    const media = await this.findOne(id);
    await this.eventMediaRepository.remove(media);
  }
}
