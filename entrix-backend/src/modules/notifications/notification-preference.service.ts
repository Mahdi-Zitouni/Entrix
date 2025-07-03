import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationPreference } from './notification-preference.entity';

@Injectable()
export class NotificationPreferenceService {
  constructor(
    @InjectRepository(NotificationPreference)
    private readonly preferenceRepo: Repository<NotificationPreference>,
  ) {}

  async getByUserId(userId: string): Promise<NotificationPreference | undefined> {
    const pref = await this.preferenceRepo.findOne({ where: { userId } });
    return pref === null ? undefined : pref;
  }

  async setPreferences(userId: string, channels: string[], optOutTypes: string[] = []): Promise<NotificationPreference> {
    let pref = await this.getByUserId(userId);
    if (!pref) {
      pref = this.preferenceRepo.create({ userId, channels, optOutTypes });
    } else {
      pref.channels = channels;
      pref.optOutTypes = optOutTypes;
    }
    return this.preferenceRepo.save(pref);
  }

  async updateOptOutTypes(userId: string, optOutTypes: string[]): Promise<NotificationPreference> {
    let pref = await this.getByUserId(userId);
    if (!pref) {
      pref = this.preferenceRepo.create({ userId, channels: [], optOutTypes });
    } else {
      pref.optOutTypes = optOutTypes;
    }
    return this.preferenceRepo.save(pref);
  }

  async optOutUser(userId: string, channel?: string, type?: string): Promise<NotificationPreference> {
    let pref = await this.getByUserId(userId);
    if (!pref) {
      pref = this.preferenceRepo.create({ 
        userId, 
        channels: channel ? [channel] : [], 
        optOutTypes: type ? [type] : [] 
      });
    } else {
      if (channel && !pref.channels.includes(channel)) {
        pref.channels.push(channel);
      }
      if (type && !pref.optOutTypes.includes(type)) {
        pref.optOutTypes.push(type);
      }
    }
    return this.preferenceRepo.save(pref);
  }
} 