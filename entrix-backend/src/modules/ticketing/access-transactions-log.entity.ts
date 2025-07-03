import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Event } from '../events/event.entity';
import { AccessRights } from './access-rights.entity';

export enum AccessTransactionType {
  CREATION = 'CREATION',
  TRANSFER = 'TRANSFER',
  RESALE = 'RESALE',
  REFUND = 'REFUND',
  UPGRADE = 'UPGRADE',
  DOWNGRADE = 'DOWNGRADE',
  CANCELLATION = 'CANCELLATION',
  SUSPENSION = 'SUSPENSION',
}

@Entity('access_transactions_log')
@Index(['accessRight'])
@Index(['event'])
@Index(['fromUser'])
@Index(['toUser'])
@Index(['createdAt'])
export class AccessTransactionsLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => AccessRights, { nullable: false })
  @JoinColumn({ name: 'access_right_id' })
  accessRight: AccessRights;

  @ManyToOne(() => Event, { nullable: true })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'from_user_id' })
  fromUser: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'to_user_id' })
  toUser: User;

  @Column({
    type: 'enum',
    enum: AccessTransactionType,
  })
  transactionType: AccessTransactionType;

  @Column({ type: 'decimal', nullable: true })
  amount: number;

  @Column({ nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}
