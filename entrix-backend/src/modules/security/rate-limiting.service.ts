import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RateLimiting } from './rate-limiting.entity';
import { CreateRateLimitingDto } from './dto/create-rate-limiting.dto';
import { UpdateRateLimitingDto } from './dto/update-rate-limiting.dto';

interface RateLimitingMetadata {
  duration?: number;
  userId?: string;
  ipAddress?: string;
}

@Injectable()
export class RateLimitingService {
  constructor(
    @InjectRepository(RateLimiting)
    private readonly rateLimitingRepository: Repository<RateLimiting>,
  ) {}

  async findAll(): Promise<RateLimiting[]> {
    return this.rateLimitingRepository.find();
  }

  async findOne(id: string): Promise<RateLimiting> {
    const rate = await this.rateLimitingRepository.findOne({ where: { id } });
    if (!rate) throw new NotFoundException('Rate limiting entry not found');
    return rate;
  }

  async create(createDto: CreateRateLimitingDto): Promise<RateLimiting> {
    const rate = this.rateLimitingRepository.create({
      identifier: createDto.key,
      identifierType: '', // Set as needed, e.g., 'user' or 'ip'
      endpoint: '', // Set as needed
      requestCount: createDto.points,
      lastRequest: new Date(),
      isBlocked: false,
      blockedUntil: undefined,
      metadata: {
        duration: createDto.duration,
        userId: createDto.userId,
        ipAddress: createDto.ipAddress,
      } as RateLimitingMetadata,
    });
    return await this.rateLimitingRepository.save(rate);
  }

  async update(
    id: string,
    updateDto: UpdateRateLimitingDto,
  ): Promise<RateLimiting> {
    const rate = await this.findOne(id);
    if (updateDto.key !== undefined) rate.identifier = updateDto.key;
    if (updateDto.points !== undefined) rate.requestCount = updateDto.points;
    if (updateDto.duration !== undefined) {
      rate.metadata = {
        ...rate.metadata,
        duration: updateDto.duration,
      } as RateLimitingMetadata;
    }
    if (updateDto.userId !== undefined) {
      rate.metadata = {
        ...rate.metadata,
        userId: updateDto.userId,
      } as RateLimitingMetadata;
    }
    if (updateDto.ipAddress !== undefined) {
      rate.metadata = {
        ...rate.metadata,
        ipAddress: updateDto.ipAddress,
      } as RateLimitingMetadata;
    }
    // identifierType and endpoint can be updated similarly if needed
    return await this.rateLimitingRepository.save(rate);
  }

  async remove(id: string): Promise<void> {
    const rate = await this.findOne(id);
    await this.rateLimitingRepository.remove(rate);
  }
}
