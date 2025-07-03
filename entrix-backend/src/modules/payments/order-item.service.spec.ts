import { Test, TestingModule } from '@nestjs/testing';
import { OrderItemService } from './order-item.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrderItem } from './order-item.entity';

describe('OrderItemService', () => {
  let service: OrderItemService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderItemService,
        {
          provide: getRepositoryToken(OrderItem),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<OrderItemService>(OrderItemService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
}); 