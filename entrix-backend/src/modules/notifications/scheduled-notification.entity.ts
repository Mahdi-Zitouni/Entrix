import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { NotificationChannel } from './notification.service';

@Entity('scheduled_notifications')
@Index(['scheduledFor'])
@Index(['status'])
@Index(['recipient'])
export class ScheduledNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ['email', 'sms', 'in-app', 'webhook'],
  })
  channel: NotificationChannel;

  @Column({ length: 255 })
  recipient: string;

  @Column({ length: 100 })
  template: string;

  @Column({ type: 'jsonb' })
  data: Record<string, unknown>;

  @Column({ type: 'timestamptz' })
  scheduledFor: Date;

  @Column({
    type: 'enum',
    enum: ['pending', 'sent', 'failed', 'cancelled'],
    default: 'pending',
  })
  status: 'pending' | 'sent' | 'failed' | 'cancelled';

  @Column({ type: 'timestamptz', nullable: true })
  sentAt?: Date;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ type: 'timestamptz', nullable: true })
  nextRetryAt?: Date;

  @Column({ length: 100 })
  createdBy: string;

  @Column({ length: 100, nullable: true })
  cancelledBy?: string;

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
} 