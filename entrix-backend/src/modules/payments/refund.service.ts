import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Refund, RefundStatus } from './refund.entity';
import { CreateRefundDto } from './dto/create-refund.dto';
import { Payment, PaymentStatus } from './payment.entity';
import { Order, OrderStatus } from './order.entity';
import { NotificationService } from '../notifications/notification.service';

// Stub for EventStatsService
class EventStatsServiceStub {
  async getEventPopularity(eventId: string) {
    return { popularity: 0 };
  }
  
  async upsertStats(eventId: string, stats: any) {
    return { success: true };
  }
}

@Injectable()
export class RefundService {
  private readonly eventStatsService = new EventStatsServiceStub();

  constructor(
    @InjectRepository(Refund)
    private readonly refundRepository: Repository<Refund>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly notificationService: NotificationService,
  ) {}

  async create(dto: CreateRefundDto) {
    // Fetch payment and order for currency/commission propagation
    const payment = await this.paymentRepository.findOne({
      where: { id: dto.paymentId },
      relations: ['order'],
    });
    if (!payment) throw new Error('Payment not found');
    const order = payment.order;
    if (!order) throw new Error('Order not found');

    // Set currency and commission fields
    const entity = this.refundRepository.create({
      ...dto,
      payment,
      order,
      currency: order.currency,
      commissionAmount: order.commissionAmount,
      commissionCurrency: order.commissionCurrency,
      status: dto.status ? (dto.status as RefundStatus) : RefundStatus.PENDING,
    });
    void this.refundRepository.save(entity);

    // Update payment refundedAmount and status
    payment.refundedAmount = (payment.refundedAmount || 0) + dto.amount;
    if (payment.refundedAmount >= payment.amount) {
      payment.status = PaymentStatus.REFUNDED;
    } else {
      payment.status = PaymentStatus.PARTIALLY_REFUNDED;
    }

    void this.paymentRepository.save(payment);

    // Optionally update order status if fully refunded
    if (payment.refundedAmount >= payment.amount) {
      order.status = OrderStatus.REFUNDED;
      await this.orderRepository.save(order);
    }

    // Notify user (stub: email)
    if (order.userId) {
      await this.notificationService.sendNotification({
        channel: 'email',
        recipient: order.userId,
        template: 'refund',
        data: { refund: entity },
      });
    }

    // After refund, update event stats for all events in the order
    if (order.items && order.items.length) {
      const eventIds = Array.from(new Set(order.items.map(item => item.eventId).filter(Boolean)));
      for (const eventId of eventIds) {
        if (eventId) {
          const stats = await this.eventStatsService.getEventPopularity(eventId);
          await this.eventStatsService.upsertStats(eventId, stats);
        }
      }
    }

    return entity;
  }

  findAll() {
    return this.refundRepository.find();
  }

  findOne(id: string) {
    return this.refundRepository.findOne({ where: { id } });
  }

  update(id: string, dto: Partial<CreateRefundDto>) {
    const updateDto = { ...dto };
    if (updateDto.status) {
      if (
        Object.values(RefundStatus).includes(updateDto.status as RefundStatus)
      ) {
        updateDto.status = updateDto.status as RefundStatus;
      } else {
        delete updateDto.status;
      }
    }
    return this.refundRepository.update(id, updateDto as DeepPartial<Refund>);
  }

  remove(id: string) {
    return this.refundRepository.delete(id);
  }

  // Check refund eligibility for an order
  async checkRefundEligibility(orderId: string): Promise<{ eligible: boolean; reason?: string }> {
    const order = await this.orderRepository.findOne({ where: { id: orderId }, relations: ['items'] });
    if (!order) return { eligible: false, reason: 'Order not found' };
    if (![ 'CONFIRMED', 'COMPLETED' ].includes(order.status)) {
      return { eligible: false, reason: 'Order is not confirmed or completed' };
    }
    // Assume all items are for the same event (simplification)
    const eventId = order.items[0]?.eventId;
    if (!eventId) return { eligible: false, reason: 'No event found for order' };
    // Fetch event
    const eventRepo = this.orderRepository.manager.getRepository('Event');
    const event = await eventRepo.findOne({ where: { id: eventId } });
    if (!event) return { eligible: false, reason: 'Event not found' };
    if (!event.scheduledStart) return { eligible: false, reason: 'Event date not set' };
    const now = new Date();
    const eventDate = new Date(event.scheduledStart);
    if (eventDate.getTime() - now.getTime() < 24 * 60 * 60 * 1000) {
      return { eligible: false, reason: 'Refunds only allowed more than 24h before event' };
    }
    return { eligible: true };
  }

  async findByQuery(query: { status?: string; userId?: string; orderId?: string; from?: Date; to?: Date }) {
    const qb = this.refundRepository.createQueryBuilder('refund');
    if (query.status) qb.andWhere('refund.status = :status', { status: query.status });
    if (query.userId) qb.andWhere('refund.userId = :userId', { userId: query.userId });
    if (query.orderId) qb.andWhere('refund.orderId = :orderId', { orderId: query.orderId });
    if (query.from) qb.andWhere('refund.createdAt >= :from', { from: query.from });
    if (query.to) qb.andWhere('refund.createdAt <= :to', { to: query.to });
    qb.orderBy('refund.createdAt', 'DESC');
    return qb.getMany();
  }
}
