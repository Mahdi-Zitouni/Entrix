import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('payment_methods')
export class PaymentMethod {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50, unique: true })
  code: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 50 })
  provider: string;

  @Column({ length: 30 })
  type: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isDefault: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxAmount?: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  processingFeeFixed: number;

  @Column({ type: 'decimal', precision: 5, scale: 4, default: 0 })
  processingFeePercent: number;

  @Column({ length: 3, default: 'TND' })
  currency: string;

  @Column({ type: 'jsonb' })
  configuration: Record<string, any>;

  @Column({ type: 'int', default: 0 })
  displayOrder: number;

  @Column({ length: 255, nullable: true })
  logoUrl?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
