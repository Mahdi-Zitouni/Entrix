import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SecurityEvent } from './security-event.entity';
import { CreateSecurityEventDto } from './dto/create-security-event.dto';
import { UpdateSecurityEventDto } from './dto/update-security-event.dto';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class SecurityEventService {
  constructor(
    @InjectRepository(SecurityEvent)
    private readonly securityEventRepository: Repository<SecurityEvent>,
    private readonly notificationService: NotificationService,
  ) {}

  async findAll(): Promise<SecurityEvent[]> {
    return this.securityEventRepository.find();
  }

  async findOne(id: string): Promise<SecurityEvent> {
    const event = await this.securityEventRepository.findOne({ where: { id } });
    if (!event) throw new NotFoundException('Security event not found');
    return event;
  }

  async create(createDto: CreateSecurityEventDto): Promise<SecurityEvent> {
    const event = this.securityEventRepository.create(createDto);
    return this.securityEventRepository.save(event);
  }

  async update(
    id: string,
    updateDto: UpdateSecurityEventDto,
  ): Promise<SecurityEvent> {
    const event = await this.findOne(id);
    Object.assign(event, updateDto);
    return this.securityEventRepository.save(event);
  }

  async remove(id: string): Promise<void> {
    const event = await this.findOne(id);
    await this.securityEventRepository.remove(event);
  }

  // Generic logEvent for anomaly logging
  async logEvent(params: {
    eventType: string;
    severity?: string;
    title?: string;
    description?: string;
    sourceIp?: string;
    targetUserId?: string;
    detectionMethod?: string;
    autoResponse?: string;
    isResolved?: boolean;
    resolvedBy?: string;
    resolvedAt?: Date;
    falsePositive?: boolean;
    evidence?: Record<string, unknown>;
    impactAssessment?: Record<string, unknown>;
    createdAt?: Date;
  }): Promise<SecurityEvent> {
    const event = this.securityEventRepository.create({
      eventType: params.eventType,
      severity: params.severity || 'MEDIUM',
      title: params.title || params.eventType,
      description: params.description || '',
      sourceIp: params.sourceIp,
      targetUserId: params.targetUserId,
      detectionMethod: params.detectionMethod || 'system',
      autoResponse: params.autoResponse,
      isResolved: params.isResolved || false,
      resolvedBy: params.resolvedBy,
      resolvedAt: params.resolvedAt,
      falsePositive: params.falsePositive || false,
      evidence: params.evidence,
      impactAssessment: params.impactAssessment,
      createdAt: params.createdAt || new Date(),
    });
    const saved = await this.securityEventRepository.save(event);
    // Notify admin if severity is HIGH or eventType is security-critical
    if (
      (params.severity && params.severity.toUpperCase() === 'HIGH') ||
      params.eventType.toLowerCase().includes('security')
    ) {
      this.notificationService.sendNotification({
        channel: 'email',
        recipient: 'admin',
        template: 'security_alert',
        data: { event: saved },
      });
    }
    return saved;
  }

  // Advanced query/filtering for admin review
  async findByQuery(query: {
    userId?: string;
    eventType?: string;
    severity?: string;
    from?: Date;
    to?: Date;
  }): Promise<SecurityEvent[]> {
    const qb = this.securityEventRepository.createQueryBuilder('event');
    if (query.userId)
      qb.andWhere('event.userId = :userId', { userId: query.userId });
    if (query.eventType)
      qb.andWhere('event.eventType = :eventType', {
        eventType: query.eventType,
      });
    if (query.severity)
      qb.andWhere('event.severity = :severity', { severity: query.severity });
    if (query.from)
      qb.andWhere('event.detectedAt >= :from', { from: query.from });
    if (query.to) qb.andWhere('event.detectedAt <= :to', { to: query.to });
    qb.orderBy('event.detectedAt', 'DESC');
    return qb.getMany();
  }
}
