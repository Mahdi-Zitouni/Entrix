import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Order, OrderStatus } from './order.entity';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async create(dto: CreateOrderDto) {
    // Calculate commission if not provided (example: 10% of subtotal)
    let commissionAmount: number | undefined = (
      dto as Partial<{ commissionAmount: number }>
    ).commissionAmount;
    if (commissionAmount === undefined && dto.subtotalAmount !== undefined) {
      commissionAmount = Math.round(dto.subtotalAmount * 0.1 * 100) / 100;
    }
    const commissionCurrency = dto.currency || 'TND';
    const entity = this.orderRepository.create({
      ...dto,
      commissionAmount,
      commissionCurrency,
      status: dto.status ? (dto.status as OrderStatus) : OrderStatus.DRAFT,
    });
    return this.orderRepository.save(entity);
  }

  findAll() {
    return this.orderRepository.find();
  }

  findOne(id: string) {
    return this.orderRepository.findOne({ where: { id } });
  }

  update(id: string, dto: Partial<CreateOrderDto>) {
    const updateDto = { ...dto };
    if (updateDto.status) {
      if (
        Object.values(OrderStatus).includes(updateDto.status as OrderStatus)
      ) {
        updateDto.status = updateDto.status as OrderStatus;
      } else {
        delete updateDto.status;
      }
    }
    return this.orderRepository.update(id, updateDto as DeepPartial<Order>);
  }

  remove(id: string) {
    return this.orderRepository.delete(id);
  }

  // Commission reporting: aggregate by date/currency
  async getCommissionReport({
    from,
    to,
    currency,
  }: {
    from?: Date;
    to?: Date;
    currency?: string;
  }) {
    const qb = this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.commissionAmount)', 'totalCommission')
      .addSelect('order.commissionCurrency', 'currency')
      .where('order.commissionAmount IS NOT NULL');
    if (from) qb.andWhere('order.createdAt >= :from', { from });
    if (to) qb.andWhere('order.createdAt <= :to', { to });
    if (currency)
      qb.andWhere('order.commissionCurrency = :currency', { currency });
    qb.groupBy('order.commissionCurrency');
    return qb.getRawMany();
  }
}
