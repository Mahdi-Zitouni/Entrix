import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('user_sessions')
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column({ length: 255, unique: true })
  sessionToken: string;

  @Column({ length: 255, nullable: true })
  refreshToken?: string;

  @Column({ type: 'inet' })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent?: string;

  @Column({ length: 255, nullable: true })
  deviceFingerprint?: string;

  @Column({ type: 'jsonb', nullable: true })
  location?: any;

  @Column({ default: false })
  isMobile: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  lastActivity: Date;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ length: 100, nullable: true })
  logoutReason?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endedAt?: Date;
}
