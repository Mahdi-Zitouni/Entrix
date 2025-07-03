import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscription } from './subscription.entity';
import {
  AccessRights,
  AccessRightStatus,
  AccessSourceType,
} from './access-rights.entity';
import { SubscriptionPlan } from './subscription-plan.entity';
import { SubscriptionPlanEvent } from './subscription-plan-event.entity';
import { SubscriptionPlanEventGroup } from './subscription-plan-event-group.entity';
import { Event } from '../events/event.entity';
import { User } from '../users/user.entity';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(AccessRights)
    private readonly accessRightsRepository: Repository<AccessRights>,
    @InjectRepository(SubscriptionPlan)
    private readonly subscriptionPlanRepository: Repository<SubscriptionPlan>,
    @InjectRepository(SubscriptionPlanEvent)
    private readonly subscriptionPlanEventRepository: Repository<SubscriptionPlanEvent>,
    @InjectRepository(SubscriptionPlanEventGroup)
    private readonly subscriptionPlanEventGroupRepository: Repository<SubscriptionPlanEventGroup>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly notificationService: NotificationService,
  ) {}

  async findAll(): Promise<Subscription[]> {
    return this.subscriptionRepository.find();
  }

  async findOne(id: string): Promise<Subscription> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id },
    });
    if (!subscription) throw new NotFoundException('Subscription not found');
    return subscription;
  }

  // Helper to generate a unique QR code (stub, replace with secure logic)
  private generateQrCode(
    subscriptionId: string,
    eventId: string,
    userId: string,
  ): string {
    return `QR-${subscriptionId}-${eventId}-${userId}-${Date.now()}`;
  }

  // Bulk generate access rights for a subscription
  async generateAccessRights(subscription: Subscription) {
    // Fetch plan
    const plan = await this.subscriptionPlanRepository.findOne({
      where: { id: subscription.subscriptionPlanId },
    });
    if (!plan) throw new Error('Subscription plan not found');
    // Fetch all events via plan-event and plan-event-group
    const planEvents = await this.subscriptionPlanEventRepository.find({
      where: { subscriptionPlan: plan },
    });
    const planEventGroups =
      await this.subscriptionPlanEventGroupRepository.find({
        where: { subscriptionPlan: plan },
        relations: ['eventGroup'],
      });
    let eventIds = planEvents.map((pe) => pe.event.id);
    for (const peg of planEventGroups) {
      // Fetch all events in the group
      const groupEvents = await this.eventRepository.find({
        where: { groupId: peg.eventGroup.id },
      });
      eventIds = eventIds.concat(groupEvents.map((e) => e.id));
    }
    // Remove duplicates
    eventIds = Array.from(new Set(eventIds));
    // Generate access rights
    const user = await this.userRepository.findOne({
      where: { id: subscription.userId },
    });
    if (!user) throw new Error('User not found');
    for (const eventId of eventIds) {
      const event = await this.eventRepository.findOne({
        where: { id: eventId },
      });
      if (!event) continue;
      const qrCode = this.generateQrCode(subscription.id, event.id, user.id);
      const accessRight = this.accessRightsRepository.create({
        qrCode: qrCode,
        user: user,
        event: event,
        subscription: subscription,
        status: AccessRightStatus.ENABLED,
        sourceType: AccessSourceType.SUBSCRIPTION,
        sourceId: subscription.id,
        validFrom: event.scheduledStart,
        validUntil: event.scheduledEnd,
        metadata: {},
      });
      await this.accessRightsRepository.save(accessRight);
    }
  }

  async create(createDto: CreateSubscriptionDto): Promise<Subscription> {
    const subscription = this.subscriptionRepository.create(createDto);
    const saved = await this.subscriptionRepository.save(subscription);
    // Notify user (stub: email)
    if (createDto.userId) {
      await this.notificationService.sendNotification({
        channel: 'email',
        recipient: createDto.userId,
        template: 'subscription_created',
        data: { subscription: saved },
      });
    }

    void this.generateAccessRights(saved);
    return saved;
  }

  async update(
    id: string,
    updateDto: UpdateSubscriptionDto,
  ): Promise<Subscription> {
    const subscription = await this.findOne(id);
    Object.assign(subscription, updateDto);
    return this.subscriptionRepository.save(subscription);
  }

  async remove(id: string): Promise<void> {
    const subscription = await this.findOne(id);
    await this.subscriptionRepository.remove(subscription);
  }

  // Regenerate access rights for a subscription (e.g., on plan update)
  async regenerateAccessRights(subscriptionId: string) {
    const subscription = await this.findOne(subscriptionId);
    // Optionally: delete old access rights first
    await this.accessRightsRepository.delete({
      subscription: { id: subscriptionId },
    });
    void this.generateAccessRights(subscription);
    return { message: 'Access rights regenerated' };
  }
}
