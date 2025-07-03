import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderItem } from './order-item.entity';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';

@Injectable()
export class OrderItemService {
  private readonly logger = new Logger(OrderItemService.name);

  constructor(
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
  ) {}

  create(dto: CreateOrderItemDto) {
    this.logger.log(`Creating order item for order ${dto.orderId}`);
    const item = this.orderItemRepository.create(dto);
    return this.orderItemRepository.save(item);
  }

  findAll() {
    return this.orderItemRepository.find();
  }

  findOne(id: string) {
    return this.orderItemRepository.findOne({ where: { id } });
  }

  update(id: string, dto: UpdateOrderItemDto) {
    this.logger.log(`Updating order item ${id}`);
    return this.orderItemRepository.update(id, dto);
  }

  remove(id: string) {
    this.logger.log(`Deleting order item ${id}`);
    return this.orderItemRepository.delete(id);
  }

  // Add business logic methods as needed
} 