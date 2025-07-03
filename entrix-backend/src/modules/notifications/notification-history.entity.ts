import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { NotificationChannel } from './notification.service';

@Entity('notification_history')
@Index(['recipient'])
@Index(['template'])
@Index(['status'])
@Index(['sentAt'])
export class NotificationHistory {
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

  @Column({
    type: 'enum',
    enum: ['sent', 'delivered', 'failed', 'bounced'],
    default: 'sent',
  })
  status: 'sent' | 'delivered' | 'failed' | 'bounced';

  @Column({ type: 'timestamptz' })
  sentAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  deliveredAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  openedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  clickedAt?: Date;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ type: 'text', nullable: true })
  providerResponse?: string;

  @Column({ length: 100 })
  sentBy: string;

  @Column({ type: 'uuid', nullable: true })
  scheduledNotificationId?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
} 