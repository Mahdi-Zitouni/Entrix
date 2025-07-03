import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('subscription_plans')
export class SubscriptionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  code: string;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 20 })
  type: string; // FULL_SEASON, HALF_SEASON, PACKAGE, FLEX, MINI, VIP_ANNUAL

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ length: 3, default: 'TND' })
  currency: string;

  @Column({ type: 'int', nullable: true })
  maxSubscribers?: number;

  @Column({ type: 'int', default: 0 })
  currentSubscribers: number;

  @Column({ type: 'date' })
  validFrom: Date;

  @Column({ type: 'date' })
  validUntil: Date;

  @Column({ type: 'date', nullable: true })
  saleStartDate?: Date;

  @Column({ type: 'date', nullable: true })
  saleEndDate?: Date;

  @Column({ default: false })
  transferable: boolean;

  @Column({ type: 'int', default: 0 })
  maxTransfers: number;

  @Column({ default: false })
  autoRenew: boolean;

  @Column({ default: false })
  includesPlayoffs: boolean;

  @Column({ default: false })
  priorityBooking: boolean;

  @Column({ type: 'jsonb', nullable: true })
  benefits?: any;

  @Column({ type: 'jsonb', nullable: true })
  restrictions?: any;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
