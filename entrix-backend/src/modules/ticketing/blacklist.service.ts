import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Blacklist, AppealStatus, BlacklistScope } from './blacklist.entity';
import { CreateBlacklistDto } from './dto/create-blacklist.dto';

@Injectable()
export class BlacklistService {
  constructor(
    @InjectRepository(Blacklist)
    private readonly blacklistRepository: Repository<Blacklist>,
  ) {}

  create(dto: CreateBlacklistDto) {
    const entity = this.blacklistRepository.create(dto);
    return this.blacklistRepository.save(entity);
  }

  findAll() {
    return this.blacklistRepository.find();
  }

  findOne(id: string) {
    return this.blacklistRepository.findOne({ where: { id } });
  }

  update(id: string, dto: Partial<CreateBlacklistDto>) {
    return this.blacklistRepository.update(id, dto);
  }

  remove(id: string) {
    return this.blacklistRepository.delete(id);
  }

  // Resolve a blacklist entry (admin)
  async resolve(id: string, notes?: string) {
    const entry = await this.findOne(id);
    if (!entry) throw new Error('Blacklist entry not found');
    entry.isActive = false;
    entry.notes = notes || entry.notes;
    return this.blacklistRepository.save(entry);
  }

  // Appeal a blacklist entry (user)
  async appeal(id: string, userId: string, reason: string) {
    const entry = await this.findOne(id);
    if (!entry) throw new Error('Blacklist entry not found');
    entry.appealStatus = AppealStatus.PENDING;
    entry.metadata = {
      ...(entry.metadata || {}),
      appeal: { userId, reason, date: new Date() },
    };
    return this.blacklistRepository.save(entry);
  }

  // Check if a user or identifier is blacklisted for an event/zone
  async isBlacklisted(params: {
    userId?: string;
    identifier?: string;
    eventId?: string;
    scope?: BlacklistScope;
  }) {
    const now = new Date();
    const qb = this.blacklistRepository
      .createQueryBuilder('bl')
      .where('bl.isActive = true')
      .andWhere('(bl.endDate IS NULL OR bl.endDate > :now)', { now });
    if (params.userId)
      qb.andWhere('bl.user = :userId', { userId: params.userId });
    if (params.identifier)
      qb.andWhere('bl.identifier = :identifier', {
        identifier: params.identifier,
      });
    if (params.eventId)
      qb.andWhere('(bl.event IS NULL OR bl.event = :eventId)', {
        eventId: params.eventId,
      });
    if (params.scope) qb.andWhere('bl.scope = :scope', { scope: params.scope });
    const count = await qb.getCount();
    return count > 0;
  }

  // Log incident evidence (admin)
  async addEvidence(id: string, evidence: Record<string, unknown>) {
    const entry = await this.findOne(id);
    if (!entry) throw new Error('Blacklist entry not found');
    entry.metadata = { ...(entry.metadata || {}), evidence };
    return this.blacklistRepository.save(entry);
  }

  // Deactivate expired blacklists (cron job)
  async deactivateExpired() {
    const now = new Date();
    const expired = await this.blacklistRepository.find({
      where: { isActive: true, endDate: LessThan(now) },
    });
    for (const entry of expired) {
      entry.isActive = false;
      await this.blacklistRepository.save(entry);
    }
    return { deactivated: expired.length };
  }
}
