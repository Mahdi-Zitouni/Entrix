import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  subscriptionNumber: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  subscriptionPlanId: string;

  @Column('uuid', { nullable: true })
  seatId?: string;

  @Column('decimal', { precision: 10, scale: 2 })
  pricePaid: number;

  @Column('uuid', { nullable: true })
  paymentId?: string;

  @Column({ type: 'date' })
  validFrom: Date;

  @Column({ type: 'date' })
  validUntil: Date;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status: string; // PENDING, ACTIVE, SUSPENDED, EXPIRED, CANCELLED, TRANSFERRED

  @Column({ type: 'text', nullable: true })
  suspensionReason?: string;

  @Column({ type: 'timestamptz', nullable: true })
  suspensionDate?: Date;

  @Column({ default: false })
  autoRenew: boolean;

  @Column({ type: 'date', nullable: true })
  renewalDate?: Date;

  @Column({ type: 'int', default: 0 })
  transfersUsed: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastTransferDate?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  activationDate?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  cancellationDate?: Date;

  @Column({ type: 'text', nullable: true })
  cancellationReason?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;

  @Column('uuid', { nullable: true })
  createdBy?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
