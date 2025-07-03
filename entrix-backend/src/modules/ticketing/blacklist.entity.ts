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

export enum BlacklistType {
  USER = 'USER',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  IP = 'IP',
  DEVICE = 'DEVICE',
  CARD = 'CARD',
}

export enum BlacklistScope {
  EVENT = 'EVENT',
  VENUE = 'VENUE',
  CLUB = 'CLUB',
  GLOBAL = 'GLOBAL',
}

export enum AppealStatus {
  NONE = 'NONE',
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

export enum SeverityLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

@Entity('blacklist')
@Index(['blacklistType', 'identifier'])
@Index(['isActive'])
@Index(['scope', 'scopeId'])
@Index(['startDate', 'endDate'])
@Index(['appealStatus'])
@Index(['severity'])
export class Blacklist {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: BlacklistType,
  })
  blacklistType: BlacklistType;

  @Column()
  identifier: string;

  @Column({
    type: 'enum',
    enum: BlacklistScope,
  })
  scope: BlacklistScope;

  @Column({ nullable: true })
  scopeId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Event, { nullable: true })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp with time zone', nullable: true })
  startDate: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  endDate: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({
    type: 'enum',
    enum: AppealStatus,
    default: AppealStatus.NONE,
  })
  appealStatus: AppealStatus;

  @Column({
    type: 'enum',
    enum: SeverityLevel,
    default: SeverityLevel.LOW,
  })
  severity: SeverityLevel;

  @Column({ nullable: true })
  notes: string;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
