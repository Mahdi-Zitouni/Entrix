import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual, Like } from 'typeorm';
import { Event } from './event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  async findAll(filters?: {
    status?: string;
    venueId?: string;
    categoryId?: string;
    from?: Date;
    to?: Date;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Event[]; total: number; page: number; limit: number }> {
    const query = this.eventRepository.createQueryBuilder('event')
      .leftJoinAndSelect('event.venue', 'venue')
      .leftJoinAndSelect('event.category', 'category');

    if (filters?.status) {
      query.andWhere('event.status = :status', { status: filters.status });
    }
    if (filters?.venueId) {
      query.andWhere('event.venueId = :venueId', { venueId: filters.venueId });
    }
    if (filters?.categoryId) {
      query.andWhere('event.categoryId = :categoryId', { categoryId: filters.categoryId });
    }
    if (filters?.search) {
      query.andWhere('event.name LIKE :search OR event.description LIKE :search', 
        { search: `%${filters.search}%` });
    }
    if (filters?.from) {
      query.andWhere('event.startDate >= :from', { from: filters.from });
    }
    if (filters?.to) {
      query.andWhere('event.endDate <= :to', { to: filters.to });
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await query
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async getUpcomingEvents(limit: number = 10): Promise<Event[]> {
    const now = new Date();
    return this.eventRepository.find({
      where: {
        scheduledStart: MoreThanOrEqual(now),
        status: 'published'
      },
      order: { scheduledStart: 'ASC' },
      take: limit,
      relations: ['venue', 'category']
    });
  }

  async getPopularEvents(limit: number = 10): Promise<Event[]> {
    return this.eventRepository.find({
      where: { status: 'published' },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['venue', 'category']
    });
  }

  async searchEvents(query: string, filters: any): Promise<Event[]> {
    const qb = this.eventRepository.createQueryBuilder('event')
      .leftJoinAndSelect('event.venue', 'venue')
      .leftJoinAndSelect('event.category', 'category')
      .where('event.name LIKE :query OR event.description LIKE :query', 
        { query: `%${query}%` });

    if (filters.status) {
      qb.andWhere('event.status = :status', { status: filters.status });
    }
    if (filters.venueId) {
      qb.andWhere('event.venueId = :venueId', { venueId: filters.venueId });
    }

    return qb.getMany();
  }

  async getEventStatistics(id: string): Promise<any> {
    const event = await this.findOne(id);
    
    return {
      eventId: id,
      totalTickets: 0,
      soldTickets: 0,
      revenue: 0,
      averageRating: 0,
      totalReviews: 0
    };
  }

  async getEventParticipants(id: string, role?: string): Promise<any[]> {
    return [
      {
        id: 'participant-1',
        eventId: id,
        userId: 'user-1',
        role: role || 'attendee',
        status: 'confirmed'
      }
    ];
  }

  async getEventMedia(id: string): Promise<any[]> {
    return [
      {
        id: 'media-1',
        eventId: id,
        type: 'image',
        url: 'https://example.com/image.jpg',
        caption: 'Event image'
      }
    ];
  }

  async getEventSchedule(id: string): Promise<any[]> {
    return [
      {
        id: 'schedule-1',
        eventId: id,
        startTime: new Date(),
        endTime: new Date(),
        title: 'Opening Ceremony',
        description: 'Event opening'
      }
    ];
  }

  async getEventRestrictions(id: string): Promise<any[]> {
    return [
      {
        id: 'restriction-1',
        eventId: id,
        type: 'age_min',
        value: '18',
        description: 'Minimum age requirement'
      }
    ];
  }

  async create(createEventDto: CreateEventDto, createdBy?: string): Promise<Event> {
    const eventEntity = this.eventRepository.create({
      ...createEventDto,
      status: createEventDto.status || 'draft'
    });
    return this.eventRepository.save(eventEntity);
  }

  async uploadMedia(id: string, file: Express.Multer.File, body: any): Promise<any> {
    const event = await this.findOne(id);
    
    return {
      id: 'media-' + Date.now(),
      eventId: id,
      type: file.mimetype.startsWith('image/') ? 'image' : 'video',
      url: `uploads/${file.filename}`,
      caption: body.caption,
      uploadedBy: body.uploadedBy
    };
  }

  async addParticipant(id: string, participantData: any): Promise<any> {
    const event = await this.findOne(id);
    
    return {
      id: 'participant-' + Date.now(),
      eventId: id,
      userId: participantData.userId,
      role: participantData.role || 'attendee',
      status: 'pending'
    };
  }

  async createSchedule(id: string, scheduleData: any): Promise<any> {
    const event = await this.findOne(id);
    
    return {
      id: 'schedule-' + Date.now(),
      eventId: id,
      startTime: scheduleData.startTime,
      endTime: scheduleData.endTime,
      title: scheduleData.title,
      description: scheduleData.description
    };
  }

  async addRestriction(id: string, restrictionData: any): Promise<any> {
    const event = await this.findOne(id);
    
    return {
      id: 'restriction-' + Date.now(),
      eventId: id,
      type: restrictionData.type,
      value: restrictionData.value,
      description: restrictionData.description
    };
  }

  async update(id: string, updateEventDto: UpdateEventDto, updatedBy?: string): Promise<Event> {
    const event = await this.findOne(id);
    Object.assign(event, {
      ...updateEventDto,
      updatedBy,
      updatedAt: new Date()
    });
    return this.eventRepository.save(event);
  }

  async updateStatus(id: string, status: string, reason?: string, updatedBy?: string): Promise<Event> {
    const event = await this.findOne(id);
    event.status = status;
    return this.eventRepository.save(event);
  }

  async publishEvent(id: string, publishedBy?: string): Promise<Event> {
    const event = await this.findOne(id);
    event.status = 'published';
    return this.eventRepository.save(event);
  }

  async remove(id: string, removedBy?: string): Promise<void> {
    const event = await this.findOne(id);
    await this.eventRepository.remove(event);
  }

  async removeMedia(id: string, mediaId: string): Promise<void> {
    const event = await this.findOne(id);
    console.log(`Removing media ${mediaId} from event ${id}`);
  }

  async removeParticipant(id: string, participantId: string): Promise<void> {
    const event = await this.findOne(id);
    console.log(`Removing participant ${participantId} from event ${id}`);
  }

  async getAnalyticsOverview(filters?: { from?: Date; to?: Date }): Promise<any> {
    const query = this.eventRepository.createQueryBuilder('event')
      .select([
        'COUNT(*) as totalEvents',
        'SUM(CASE WHEN event.status = :publishedStatus THEN 1 ELSE 0 END) as publishedEvents',
        'SUM(CASE WHEN event.status = :draftStatus THEN 1 ELSE 0 END) as draftEvents'
      ])
      .setParameter('publishedStatus', 'published')
      .setParameter('draftStatus', 'draft');

    if (filters?.from) {
      query.andWhere('event.createdAt >= :from', { from: filters.from });
    }
    if (filters?.to) {
      query.andWhere('event.createdAt <= :to', { to: filters.to });
    }

    const result = await query.getRawOne();
    return {
      totalEvents: parseInt(result.totalEvents),
      publishedEvents: parseInt(result.publishedEvents),
      draftEvents: parseInt(result.draftEvents)
    };
  }

  async getEventTrends(period: string, filters?: { from?: Date; to?: Date }): Promise<any[]> {
    const query = this.eventRepository.createQueryBuilder('event')
      .select('DATE(event.createdAt)', 'date')
      .addSelect('COUNT(*)', 'count')
      .groupBy('DATE(event.createdAt)')
      .orderBy('date', 'ASC');

    if (filters?.from) {
      query.andWhere('event.createdAt >= :from', { from: filters.from });
    }
    if (filters?.to) {
      query.andWhere('event.createdAt <= :to', { to: filters.to });
    }

    return query.getRawMany();
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventRepository.findOne({ 
      where: { id },
      relations: ['venue', 'category']
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }
} 