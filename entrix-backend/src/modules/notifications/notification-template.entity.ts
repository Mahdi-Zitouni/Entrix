import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { NotificationChannel } from './notification.service';

@Entity('notification_templates')
@Index(['name'], { unique: true })
@Index(['type', 'channel'])
export class NotificationTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100 })
  name: string;

  @Column({ length: 50 })
  type: string;

  @Column({
    type: 'enum',
    enum: ['email', 'sms', 'in-app', 'webhook'],
  })
  channel: NotificationChannel;

  @Column({ length: 200, nullable: true })
  subject?: string;

  @Column({ type: 'text' })
  content: string;

  @Column('simple-array', { nullable: true })
  variables: string[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ length: 100, nullable: true })
  createdBy?: string;

  @Column({ length: 100, nullable: true })
  updatedBy?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
} 