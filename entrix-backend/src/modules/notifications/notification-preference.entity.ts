import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('notification_preferences')
export class NotificationPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('simple-array')
  channels: string[]; // e.g., ['email', 'sms', 'in-app']

  @Column('simple-array', { nullable: true })
  optOutTypes: string[]; // e.g., ['marketing', 'security_alert']
} 