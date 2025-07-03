import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { PaymentMethod } from './payment-method.entity';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  REFUNDED = 'REFUNDED',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true })
  orderNumber: string;

  @Column({ type: 'uuid', nullable: true })
  userId?: string;

  @Column({ length: 255, nullable: true })
  guestEmail?: string;

  @Column({ length: 20, nullable: true })
  guestPhone?: string;

  @Column({ length: 200, nullable: true })
  guestName?: string;

  @Column({ length: 20, nullable: true })
  phoneNumber?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotalAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  processingFee: number;

  @Column({ length: 3, default: 'TND' })
  currency: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  commissionAmount?: number;

  @Column({ type: 'varchar', length: 3, nullable: true })
  commissionCurrency?: string;

  @ManyToOne(() => PaymentMethod, { nullable: true })
  @JoinColumn({ name: 'payment_method_id' })
  paymentMethod?: PaymentMethod;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.DRAFT })
  status: OrderStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  paymentProofFile?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  transactionNumber?: string;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt?: Date;

  @Column({ length: 50, nullable: true })
  purchaseChannel: string;

  @Column({ type: 'inet', nullable: true })
  ipAddress?: string;

  @Column({ type: 'text', nullable: true })
  userAgent?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ length: 50, nullable: true })
  couponCode?: string;

  @Column({ length: 255, nullable: true })
  referrer?: string;

  @Column({ length: 2, default: 'fr' })
  language: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @Column({ type: 'timestamptz', nullable: true })
  confirmedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt?: Date;

  @Column({ type: 'text', nullable: true })
  cancellationReason?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => OrderItem, item => item.order)
  items: OrderItem[];
}
