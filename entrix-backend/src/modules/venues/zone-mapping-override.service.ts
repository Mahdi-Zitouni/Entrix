import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { ZoneMappingOverride } from './zone-mapping-override.entity';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class ZoneMappingOverrideService {
  constructor(
    @InjectRepository(ZoneMappingOverride)
    private readonly overrideRepo: Repository<ZoneMappingOverride>,
    private readonly notificationService: NotificationService,
  ) {}

  async create(dto: Partial<ZoneMappingOverride>) {
    const entity = this.overrideRepo.create(dto);
    const saved = await this.overrideRepo.save(entity);
    // Notification logic
    if (saved.requiresNotification && !saved.notificationSent) {
      // Notify admin about zone mapping override (stub)
      this.notificationService.sendNotification({
        channel: 'email',
        recipient: 'admin',
        template: 'zone_override',
        data: { override: saved },
      });
      console.log(`[ZoneMappingOverride] Admin notified of override: ${saved.id}`);
      saved.notificationSent = true;
      await this.overrideRepo.save(saved);
    }
    return saved;
  }

  findAll() {
    return this.overrideRepo.find();
  }

  findOne(id: string) {
    return this.overrideRepo.findOne({ where: { id } });
  }

  update(id: string, dto: Partial<ZoneMappingOverride>) {
    const { event, venue, zone, seat, ...rest } = dto;
    return this.overrideRepo.update(id, ({
      ...rest,
      event:
        typeof event === 'object' &&
        event !== null &&
        'id' in event &&
        typeof event.id === 'string'
          ? { id: event.id }
          : typeof event === 'string'
            ? { id: event }
            : undefined,
      venue:
        typeof venue === 'object' &&
        venue !== null &&
        'id' in venue &&
        typeof venue.id === 'string'
          ? { id: venue.id }
          : typeof venue === 'string'
            ? { id: venue }
            : undefined,
      zone:
        typeof zone === 'object' &&
        zone !== null &&
        'id' in zone &&
        typeof zone.id === 'string'
          ? { id: zone.id }
          : typeof zone === 'string'
            ? { id: zone }
            : undefined,
      seat:
        typeof seat === 'object' &&
        seat !== null &&
        'id' in seat &&
        typeof seat.id === 'string'
          ? { id: seat.id }
          : typeof seat === 'string'
            ? { id: seat }
            : undefined,
    } as any));
  }

  remove(id: string) {
    return this.overrideRepo.delete(id);
  }

  activate(id: string) {
    return this.overrideRepo.update(id, { isActive: true });
  }

  deactivate(id: string) {
    return this.overrideRepo.update(id, { isActive: false });
  }

  // Get active override for a given event/venue/zone/seat and date
  async getActiveOverride(params: {
    eventId?: string;
    venueId?: string;
    zoneId?: string;
    seatId?: string;
    date?: Date;
  }) {
    const now = params.date || new Date();
    const whereClauses = [];
    if (params.seatId)
      whereClauses.push({
        seat: { id: params.seatId },
        isActive: true,
        effectiveFrom: LessThanOrEqual(now),
        effectiveTo: MoreThanOrEqual(now),
      });
    if (params.zoneId)
      whereClauses.push({
        zone: { id: params.zoneId },
        isActive: true,
        effectiveFrom: LessThanOrEqual(now),
        effectiveTo: MoreThanOrEqual(now),
      });
    if (params.venueId)
      whereClauses.push({
        venue: { id: params.venueId },
        isActive: true,
        effectiveFrom: LessThanOrEqual(now),
        effectiveTo: MoreThanOrEqual(now),
      });
    if (params.eventId)
      whereClauses.push({
        event: { id: params.eventId },
        isActive: true,
        effectiveFrom: LessThanOrEqual(now),
        effectiveTo: MoreThanOrEqual(now),
      });
    return this.overrideRepo.findOne({
      where: whereClauses,
      relations: ['event', 'venue', 'zone', 'seat'],
      order: { overrideType: 'DESC' },
    });
  }
}
