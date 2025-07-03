import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccessControlLog } from './access-control-log.entity';
import { CreateAccessControlLogDto } from './dto/create-access-control-log.dto';
import { EventStatsService } from '../events/event-stats.service';
import { BlacklistService } from './blacklist.service';
import { AccessRights, AccessRightStatus } from './access-rights.entity';

@Injectable()
export class AccessControlLogService {
  constructor(
    @InjectRepository(AccessControlLog)
    private readonly accessControlLogRepository: Repository<AccessControlLog>,
    private readonly eventStatsService: EventStatsService,
    private readonly blacklistService: BlacklistService,
    @InjectRepository(AccessRights)
    private readonly accessRightsRepository: Repository<AccessRights>,
  ) {}

  async create(dto: CreateAccessControlLogDto) {
    // Enforce blacklist
    if (dto.userId && dto.eventId) {
      const isBlacklisted = await this.blacklistService.isBlacklisted({ userId: dto.userId, eventId: dto.eventId });
      if (isBlacklisted) throw new Error('User is blacklisted and cannot check in for this event.');
    }
    // Enforce access rights
    if (dto.userId && dto.eventId) {
      const accessRight = await this.accessRightsRepository.findOne({ where: { id: dto.accessRightId, user: { id: dto.userId }, event: { id: dto.eventId }, status: AccessRightStatus.ENABLED } });
      if (!accessRight) throw new Error('User does not have valid access rights for this event.');
    }
    const entity = this.accessControlLogRepository.create(dto);
    const saved = await this.accessControlLogRepository.save(entity);
    // If this is a successful ENTRY, update event stats
    if (dto.action === 'ENTRY' && dto.status === 'SUCCESS' && dto.eventId) {
      const stats = await this.eventStatsService.getEventPopularity(dto.eventId);
      await this.eventStatsService.upsertStats(dto.eventId, stats);
    }
    return saved;
  }

  findAll() {
    return this.accessControlLogRepository.find();
  }

  findOne(id: string) {
    return this.accessControlLogRepository.findOne({ where: { id } });
  }

  update(id: string, dto: Partial<CreateAccessControlLogDto>) {
    return this.accessControlLogRepository.update(id, dto);
  }

  remove(id: string) {
    return this.accessControlLogRepository.delete(id);
  }
}
