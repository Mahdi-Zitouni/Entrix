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
import { Ticket } from './ticket.entity';

export enum AccessAction {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
  RE_ENTRY = 'RE_ENTRY',
  ZONE_CHANGE = 'ZONE_CHANGE',
  VALIDATION = 'VALIDATION',
}

export enum AccessStatus {
  SUCCESS = 'SUCCESS',
  DENIED = 'DENIED',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
}

export enum DenialReason {
  INVALID_QR = 'INVALID_QR',
  ALREADY_USED = 'ALREADY_USED',
  EXPIRED = 'EXPIRED',
  WRONG_EVENT = 'WRONG_EVENT',
  WRONG_ZONE = 'WRONG_ZONE',
  WRONG_TIME = 'WRONG_TIME',
  BLACKLISTED = 'BLACKLISTED',
  TECHNICAL_ERROR = 'TECHNICAL_ERROR',
  INSUFFICIENT_RIGHTS = 'INSUFFICIENT_RIGHTS',
  CAPACITY_FULL = 'CAPACITY_FULL',
}

@Entity('access_control_log')
@Index(['event'])
@Index(['user'])
@Index(['timestamp'])
@Index(['accessPointId'])
@Index(['status'])
export class AccessControlLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Event, { nullable: false })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => AccessRights, { nullable: false })
  @JoinColumn({ name: 'access_right_id' })
  accessRight: AccessRights;

  @ManyToOne(() => Ticket, { nullable: true })
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;

  @Column({ nullable: true })
  accessPointId: string;

  @Column({
    type: 'enum',
    enum: AccessAction,
  })
  action: AccessAction;

  @Column({
    type: 'enum',
    enum: AccessStatus,
  })
  status: AccessStatus;

  @Column({
    type: 'enum',
    enum: DenialReason,
    nullable: true,
  })
  denialReason: DenialReason;

  @Column({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  timestamp: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;
}
