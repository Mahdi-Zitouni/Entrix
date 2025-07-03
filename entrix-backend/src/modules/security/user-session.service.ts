import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSession } from './user-session.entity';
import { CreateUserSessionDto } from './dto/create-user-session.dto';
import { UpdateUserSessionDto } from './dto/update-user-session.dto';

@Injectable()
export class UserSessionService {
  constructor(
    @InjectRepository(UserSession)
    private readonly userSessionRepository: Repository<UserSession>,
  ) {}

  async findAll(): Promise<UserSession[]> {
    return this.userSessionRepository.find();
  }

  async findOne(id: string): Promise<UserSession> {
    const session = await this.userSessionRepository.findOne({ where: { id } });
    if (!session) throw new NotFoundException('User session not found');
    return session;
  }

  async create(createDto: CreateUserSessionDto): Promise<UserSession> {
    const session = this.userSessionRepository.create(createDto);
    return this.userSessionRepository.save(session);
  }

  async update(
    id: string,
    updateDto: UpdateUserSessionDto,
  ): Promise<UserSession> {
    const session = await this.findOne(id);
    Object.assign(session, updateDto);
    return this.userSessionRepository.save(session);
  }

  async remove(id: string): Promise<void> {
    const session = await this.findOne(id);
    await this.userSessionRepository.remove(session);
  }

  async findByQuery(query: { userId?: string; isActive?: boolean; ipAddress?: string; deviceFingerprint?: string; from?: Date; to?: Date }) {
    const qb = this.userSessionRepository.createQueryBuilder('session');
    if (query.userId) qb.andWhere('session.userId = :userId', { userId: query.userId });
    if (query.isActive !== undefined) qb.andWhere('session.isActive = :isActive', { isActive: query.isActive });
    if (query.ipAddress) qb.andWhere('session.ipAddress = :ipAddress', { ipAddress: query.ipAddress });
    if (query.deviceFingerprint) qb.andWhere('session.deviceFingerprint = :deviceFingerprint', { deviceFingerprint: query.deviceFingerprint });
    if (query.from) qb.andWhere('session.createdAt >= :from', { from: query.from });
    if (query.to) qb.andWhere('session.createdAt <= :to', { to: query.to });
    qb.orderBy('session.createdAt', 'DESC');
    return qb.getMany();
  }
}
