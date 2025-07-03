import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('login_attempts')
export class LoginAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  email: string;

  @Column('uuid', { nullable: true })
  userId?: string;

  @Column({ type: 'inet' })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent?: string;

  @Column({ default: false })
  success: boolean;

  @Column({ length: 100, nullable: true })
  failureReason?: string;

  @Column({ default: false })
  mfaRequired: boolean;

  @Column({ nullable: true })
  mfaSuccess?: boolean;

  @Column({ type: 'jsonb', nullable: true })
  geolocation?: any;

  @Column({ default: false })
  isSuspicious: boolean;

  @Column('uuid', { nullable: true })
  sessionId?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
