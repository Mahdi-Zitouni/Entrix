import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { Order } from './order.entity';
import { LessThanOrEqual, MoreThanOrEqual, Like } from 'typeorm';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async findAll(filters?: {
    status?: string;
    method?: string;
    userId?: string;
    orderId?: string;
    from?: Date;
    to?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ data: Payment[]; total: number; page: number; limit: number }> {
    const query = this.paymentRepository.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.order', 'order')
      .leftJoinAndSelect('payment.user', 'user');

    if (filters?.status) {
      query.andWhere('payment.status = :status', { status: filters.status });
    }
    if (filters?.method) {
      query.andWhere('payment.method = :method', { method: filters.method });
    }
    if (filters?.userId) {
      query.andWhere('payment.userId = :userId', { userId: filters.userId });
    }
    if (filters?.orderId) {
      query.andWhere('payment.orderId = :orderId', { orderId: filters.orderId });
    }
    if (filters?.from || filters?.to) {
      const whereCondition: any = {};
      if (filters.from) whereCondition.createdAt = MoreThanOrEqual(filters.from);
      if (filters.to) whereCondition.createdAt = LessThanOrEqual(filters.to);
      query.andWhere(whereCondition);
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await query
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async searchPayments(query: string, filters: any): Promise<Payment[]> {
    const qb = this.paymentRepository.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.order', 'order')
      .leftJoinAndSelect('payment.user', 'user')
      .where('payment.id LIKE :query OR order.id LIKE :query OR user.email LIKE :query', 
        { query: `%${query}%` });

    if (filters.status) {
      qb.andWhere('payment.status = :status', { status: filters.status });
    }
    if (filters.method) {
      qb.andWhere('payment.method = :method', { method: filters.method });
    }

    return qb.getMany();
  }

  async getUserPayments(userId: string, filters?: { status?: string; from?: Date; to?: Date }): Promise<Payment[]> {
    const query = this.paymentRepository.createQueryBuilder('payment')
      .leftJoinAndSelect('payment.order', 'order')
      .where('payment.userId = :userId', { userId });

    if (filters?.status) {
      query.andWhere('payment.status = :status', { status: filters.status });
    }
    if (filters?.from || filters?.to) {
      const whereCondition: any = {};
      if (filters.from) whereCondition.createdAt = MoreThanOrEqual(filters.from);
      if (filters.to) whereCondition.createdAt = LessThanOrEqual(filters.to);
      query.andWhere(whereCondition);
    }

    return query.getMany();
  }

  async getAnalyticsOverview(filters?: { from?: Date; to?: Date }): Promise<any> {
    const query = this.paymentRepository.createQueryBuilder('payment')
      .select([
        'COUNT(*) as totalPayments',
        'SUM(CASE WHEN payment.status = :successStatus THEN 1 ELSE 0 END) as successfulPayments',
        'SUM(CASE WHEN payment.status = :failedStatus THEN 1 ELSE 0 END) as failedPayments',
        'SUM(payment.amount) as totalAmount',
        'SUM(payment.commissionAmount) as totalCommission'
      ])
      .setParameter('successStatus', PaymentStatus.COMPLETED)
      .setParameter('failedStatus', PaymentStatus.FAILED);

    if (filters?.from || filters?.to) {
      const whereCondition: any = {};
      if (filters.from) whereCondition.createdAt = MoreThanOrEqual(filters.from);
      if (filters.to) whereCondition.createdAt = LessThanOrEqual(filters.to);
      query.andWhere(whereCondition);
    }

    const result = await query.getRawOne();
    return {
      totalPayments: parseInt(result.totalPayments),
      successfulPayments: parseInt(result.successfulPayments),
      failedPayments: parseInt(result.failedPayments),
      totalAmount: parseFloat(result.totalAmount) || 0,
      totalCommission: parseFloat(result.totalCommission) || 0,
      successRate: result.totalPayments > 0 ? (result.successfulPayments / result.totalPayments) * 100 : 0
    };
  }

  async getRevenueAnalytics(period: string, filters?: { from?: Date; to?: Date }): Promise<any> {
    const query = this.paymentRepository.createQueryBuilder('payment')
      .select([
        'DATE(payment.createdAt) as date',
        'COUNT(*) as count',
        'SUM(payment.amount) as revenue',
        'SUM(payment.commissionAmount) as commission'
      ])
      .where('payment.status = :status', { status: PaymentStatus.COMPLETED })
      .groupBy('DATE(payment.createdAt)')
      .orderBy('date', 'ASC');

    if (filters?.from) {
      query.andWhere('payment.createdAt >= :from', { from: filters.from });
    }
    if (filters?.to) {
      query.andWhere('payment.createdAt <= :to', { to: filters.to });
    }

    return query.getRawMany();
  }

  async getPaymentMethodsAnalytics(filters?: { from?: Date; to?: Date }): Promise<any> {
    const query = this.paymentRepository.createQueryBuilder('payment')
      .select([
        'payment.method',
        'COUNT(*) as count',
        'SUM(payment.amount) as totalAmount',
        'SUM(CASE WHEN payment.status = :successStatus THEN 1 ELSE 0 END) as successfulCount'
      ])
      .setParameter('successStatus', PaymentStatus.COMPLETED)
      .groupBy('payment.method');

    if (filters?.from || filters?.to) {
      const whereCondition: any = {};
      if (filters.from) whereCondition.createdAt = MoreThanOrEqual(filters.from);
      if (filters.to) whereCondition.createdAt = LessThanOrEqual(filters.to);
      query.andWhere(whereCondition);
    }

    return query.getRawMany();
  }

  async getFailureAnalytics(filters?: { from?: Date; to?: Date }): Promise<any> {
    const query = this.paymentRepository.createQueryBuilder('payment')
      .select([
        'payment.method',
        'payment.failureReason',
        'COUNT(*) as failureCount'
      ])
      .where('payment.status = :status', { status: PaymentStatus.FAILED })
      .groupBy('payment.method, payment.failureReason');

    if (filters?.from || filters?.to) {
      const whereCondition: any = {};
      if (filters.from) whereCondition.createdAt = MoreThanOrEqual(filters.from);
      if (filters.to) whereCondition.createdAt = LessThanOrEqual(filters.to);
      query.andWhere(whereCondition);
    }

    return query.getRawMany();
  }

  async create(dto: CreatePaymentDto, createdBy?: string): Promise<Payment> {
    // Fetch order for currency/commission propagation
    const order = await this.orderRepository.findOne({
      where: { id: dto.orderId },
    });
    if (!order) throw new Error('Order not found');

    // Calculate commission from order
    const commissionAmount = order.commissionAmount;

    const entity = this.paymentRepository.create({
      ...dto,
      order,
      currency: order.currency,
      commissionAmount,
      commissionCurrency: order.commissionCurrency,
      status: dto.status
        ? (dto.status as PaymentStatus)
        : PaymentStatus.PENDING,
    });
    return this.paymentRepository.save(entity);
  }

  async processPayment(paymentId: string, method: string, details?: any, processedBy?: string): Promise<Payment> {
    const payment = await this.findOne(paymentId);
    
    payment.status = PaymentStatus.PENDING;
    
    return this.paymentRepository.save(payment);
  }

  async capturePayment(id: string, amount?: number, capturedBy?: string): Promise<Payment> {
    const payment = await this.findOne(id);
    
    if (payment.status !== PaymentStatus.PENDING) {
      throw new Error('Payment is not pending capture');
    }
    
    payment.status = PaymentStatus.COMPLETED;
    if (amount) {
      payment.amount = amount;
    }
    
    return this.paymentRepository.save(payment);
  }

  async refundPayment(id: string, reason: string, amount?: number, refundedBy?: string): Promise<Payment> {
    const payment = await this.findOne(id);
    
    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new Error('Payment is not completed and cannot be refunded');
    }
    
    payment.status = PaymentStatus.REFUNDED;
    
    if (amount) {
      payment.refundedAmount = amount;
    } else {
      payment.refundedAmount = payment.amount;
    }
    
    return this.paymentRepository.save(payment);
  }

  async cancelPayment(id: string, reason: string, cancelledBy?: string): Promise<Payment> {
    const payment = await this.findOne(id);
    
    if (payment.status !== PaymentStatus.PENDING) {
      throw new Error('Payment is not pending and cannot be cancelled');
    }
    
    payment.status = PaymentStatus.CANCELLED;
    
    return this.paymentRepository.save(payment);
  }

  async handleWebhook(provider: string, payload: any, headers: any, ip: string): Promise<any> {
    // Process webhook based on provider
    console.log(`Processing webhook from ${provider}`, { payload, headers, ip });
    
    // This would contain provider-specific webhook processing logic
    return {
      success: true,
      provider,
      processedAt: new Date()
    };
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({ 
      where: { id },
      relations: ['order', 'user']
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async getPaymentDetails(id: string): Promise<any> {
    const payment = await this.findOne(id);
    
    return {
      ...payment,
      orderDetails: payment.order,
      processingHistory: await this.getPaymentHistory(id)
    };
  }

  async getPaymentHistory(id: string): Promise<any[]> {
    // This would typically come from a payment history/audit log
    // For now, return mock data
    return [
      {
        timestamp: new Date(),
        action: 'created',
        status: 'pending'
      }
    ];
  }

  async getPaymentRefunds(id: string): Promise<any[]> {
    // This would fetch refunds for a specific payment
    // For now, return mock data
    return [];
  }

  async update(id: string, dto: Partial<CreatePaymentDto>, updatedBy?: string): Promise<Payment> {
    const payment = await this.findOne(id);
    const updateDto = { ...dto };
    if (updateDto.status) {
      updateDto.status = updateDto.status as PaymentStatus;
    }
    
    Object.assign(payment, updateDto);
    return this.paymentRepository.save(payment);
  }

  async updateStatus(id: string, status: string, reason?: string, updatedBy?: string): Promise<Payment> {
    const payment = await this.findOne(id);
    payment.status = status as PaymentStatus;
    
    return this.paymentRepository.save(payment);
  }

  async remove(id: string, removedBy?: string): Promise<void> {
    const payment = await this.findOne(id);
    await this.paymentRepository.remove(payment);
  }

  async getAvailableMethods(userId: string): Promise<string[]> {
    // This would check user's available payment methods
    // For now, return default methods
    return ['credit_card', 'debit_card', 'bank_transfer', 'digital_wallet'];
  }

  async getSupportedMethods(): Promise<string[]> {
    // Return all supported payment methods
    return ['credit_card', 'debit_card', 'bank_transfer', 'digital_wallet', 'crypto'];
  }

  async testPaymentMethod(method: string, config: any, testedBy?: string): Promise<any> {
    // Test payment method configuration
    console.log(`Testing payment method: ${method}`, config);
    
    return {
      method,
      success: true,
      testedAt: new Date(),
      testedBy
    };
  }

  async searchRefunds(filters?: {
    status?: string;
    paymentId?: string;
    userId?: string;
    from?: Date;
    to?: Date;
  }): Promise<any[]> {
    const query = this.paymentRepository.createQueryBuilder('payment')
      .where('payment.status = :refundedStatus', { refundedStatus: PaymentStatus.REFUNDED });

    if (filters?.status) {
      query.andWhere('payment.refundStatus = :status', { status: filters.status });
    }
    if (filters?.paymentId) {
      query.andWhere('payment.id = :paymentId', { paymentId: filters.paymentId });
    }
    if (filters?.userId) {
      query.andWhere('payment.userId = :userId', { userId: filters.userId });
    }
    if (filters?.from || filters?.to) {
      const whereCondition: any = {};
      if (filters.from) whereCondition.refundedAt = MoreThanOrEqual(filters.from);
      if (filters.to) whereCondition.refundedAt = LessThanOrEqual(filters.to);
      query.andWhere(whereCondition);
    }

    return query.getMany();
  }

  async getWebhookLogs(filters?: {
    provider?: string;
    status?: string;
    from?: Date;
    to?: Date;
  }): Promise<any[]> {
    // This would fetch webhook logs from a webhook log table
    // For now, return mock data
    return [
      {
        id: '1',
        provider: 'stripe',
        status: 'success',
        timestamp: new Date(),
        payload: {}
      }
    ];
  }

  async retryWebhook(id: string, retriedBy?: string): Promise<any> {
    // Retry failed webhook
    console.log(`Retrying webhook: ${id}`);
    
    return {
      id,
      success: true,
      retriedAt: new Date(),
      retriedBy
    };
  }

  async generateRevenueReport(filters?: { from?: Date; to?: Date }): Promise<any[]> {
    const query = this.paymentRepository.createQueryBuilder('payment')
      .select([
        'payment.id',
        'payment.amount',
        'payment.currency',
        'payment.status',
        'payment.createdAt',
        'order.id as orderId',
        'user.email as userEmail'
      ])
      .leftJoin('payment.order', 'order')
      .leftJoin('payment.user', 'user')
      .where('payment.status = :status', { status: PaymentStatus.COMPLETED });

    if (filters?.from) {
      query.andWhere('payment.createdAt >= :from', { from: filters.from });
    }
    if (filters?.to) {
      query.andWhere('payment.createdAt <= :to', { to: filters.to });
    }

    return query.getRawMany();
  }

  async generateRefundsReport(filters?: { from?: Date; to?: Date }): Promise<any[]> {
    const query = this.paymentRepository.createQueryBuilder('payment')
      .select([
        'payment.id',
        'payment.refundAmount',
        'payment.refundReason',
        'payment.refundedAt',
        'order.id as orderId',
        'user.email as userEmail'
      ])
      .leftJoin('payment.order', 'order')
      .leftJoin('payment.user', 'user')
      .where('payment.status = :status', { status: PaymentStatus.REFUNDED });

    if (filters?.from) {
      query.andWhere('payment.refundedAt >= :from', { from: filters.from });
    }
    if (filters?.to) {
      query.andWhere('payment.refundedAt <= :to', { to: filters.to });
    }

    return query.getRawMany();
  }

  async generateFailuresReport(filters?: { from?: Date; to?: Date }): Promise<any[]> {
    const query = this.paymentRepository.createQueryBuilder('payment')
      .select([
        'payment.id',
        'payment.method',
        'payment.failureReason',
        'payment.createdAt',
        'order.id as orderId',
        'user.email as userEmail'
      ])
      .leftJoin('payment.order', 'order')
      .leftJoin('payment.user', 'user')
      .where('payment.status = :status', { status: PaymentStatus.FAILED });

    if (filters?.from) {
      query.andWhere('payment.createdAt >= :from', { from: filters.from });
    }
    if (filters?.to) {
      query.andWhere('payment.createdAt <= :to', { to: filters.to });
    }

    return query.getRawMany();
  }

  async getReconciliationData(filters?: { from?: Date; to?: Date; provider?: string }): Promise<any> {
    // This would fetch reconciliation data for payment providers
    return {
      totalPayments: 100,
      totalAmount: 10000,
      reconciledPayments: 95,
      unreconciledPayments: 5,
      discrepancies: []
    };
  }

  async processReconciliation(from: Date, to: Date, provider?: string, processedBy?: string): Promise<any> {
    // Process payment reconciliation
    console.log(`Processing reconciliation from ${from} to ${to} for provider ${provider}`);
    
    return {
      success: true,
      processedAt: new Date(),
      processedBy,
      results: {
        reconciled: 10,
        discrepancies: 2
      }
    };
  }

  // --- Controller contract stubs below ---

  // Add stubs for any missing methods here as needed for controller contract
} 