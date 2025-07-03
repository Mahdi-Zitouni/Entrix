import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventStats } from './event-stats.entity';
import { CreateEventStatsDto } from './dto/create-event-stats.dto';
import { UpdateEventStatsDto } from './dto/update-event-stats.dto';
import { Ticket } from '../ticketing/ticket.entity';
import { Event } from './event.entity';

@Injectable()
export class EventStatsService {
  constructor(
    @InjectRepository(EventStats)
    private readonly eventStatsRepository: Repository<EventStats>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  async findAll(): Promise<EventStats[]> {
    return this.eventStatsRepository.find();
  }

  async findOne(id: string): Promise<EventStats> {
    const stats = await this.eventStatsRepository.findOne({ where: { id } });
    if (!stats) throw new NotFoundException('Event stats not found');
    return stats;
  }

  async create(createDto: CreateEventStatsDto): Promise<EventStats> {
    const stats = this.eventStatsRepository.create(createDto);
    return this.eventStatsRepository.save(stats);
  }

  async update(
    id: string,
    updateDto: UpdateEventStatsDto,
  ): Promise<EventStats> {
    const stats = await this.findOne(id);
    Object.assign(stats, updateDto);
    return this.eventStatsRepository.save(stats);
  }

  async remove(id: string): Promise<void> {
    const stats = await this.findOne(id);
    await this.eventStatsRepository.remove(stats);
  }

  // Aggregate event popularity/stats
  async getEventPopularity(eventId: string) {
    const [totalTickets, totalRevenue, attendance] = await Promise.all([
      this.ticketRepository.count({ where: { eventId } }),
      this.ticketRepository
        .createQueryBuilder('ticket')
        .select('SUM(ticket.pricePaid)', 'sum')
        .where('ticket.eventId = :eventId', { eventId })
        .getRawOne()
        .then((res) => Number(res.sum) || 0),
      this.ticketRepository.count({ where: { eventId, bookingStatus: 'CONFIRMED' } }),
    ]);
    return {
      eventId,
      totalTickets,
      totalRevenue,
      attendance,
    };
  }

  async upsertStats(eventId: string, stats: { totalTickets: number; totalRevenue: number; attendance: number }) {
    let existing = await this.eventStatsRepository.findOne({ where: { eventId } });
    if (existing) {
      Object.assign(existing, stats);
      return this.eventStatsRepository.save(existing);
    } else {
      return this.eventStatsRepository.save({ eventId, ...stats });
    }
  }

  async getEventStats(eventId: string): Promise<any> {
    return {
      eventId,
      totalTickets: 0,
      soldTickets: 0,
      revenue: 0,
      averageRating: 0,
      totalReviews: 0
    };
  }

  async updateEventStats(eventId: string, stats: any): Promise<void> {
    // TODO: Implement stats update
    console.log(`Updating stats for event ${eventId}:`, stats);
  }
}
