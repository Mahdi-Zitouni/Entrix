import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Event } from '../events/event.entity';
import { Subscription } from './subscription.entity';
import { Ticket } from './ticket.entity';

export enum AccessRightStatus {
  ENABLED = 'ENABLED',
  DISABLED = 'DISABLED',
  USED = 'USED',
  EXPIRED = 'EXPIRED',
  TRANSFERRED = 'TRANSFERRED',
  CANCELLED = 'CANCELLED',
  SUSPENDED = 'SUSPENDED',
}

export enum AccessSourceType {
  SUBSCRIPTION = 'SUBSCRIPTION',
  TICKET = 'TICKET',
  INVITATION = 'INVITATION',
  STAFF = 'STAFF',
  PRESS = 'PRESS',
  VIP = 'VIP',
  TRANSFER = 'TRANSFER',
}

@Entity('access_rights')
@Index(['qrCode'])
@Index(['user'])
@Index(['event'])
@Index(['status'])
export class AccessRights {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  qrCode: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Event, { nullable: false })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @ManyToOne(() => Subscription, { nullable: true })
  @JoinColumn({ name: 'subscription_id' })
  subscription: Subscription;

  @ManyToOne(() => Ticket, { nullable: true })
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;

  @Column({
    type: 'enum',
    enum: AccessRightStatus,
    default: AccessRightStatus.ENABLED,
  })
  status: AccessRightStatus;

  @Column({
    type: 'enum',
    enum: AccessSourceType,
  })
  sourceType: AccessSourceType;

  @Column({ nullable: true })
  sourceId: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  validFrom: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  validUntil: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
