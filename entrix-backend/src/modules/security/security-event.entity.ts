import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('security_events')
export class SecurityEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  eventType: string;

  @Column({ length: 10 })
  severity: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'inet', nullable: true })
  sourceIp?: string;

  @Column('uuid', { nullable: true })
  targetUserId?: string;

  @Column('uuid', { nullable: true })
  relatedSessionId?: string;

  @Column({ length: 100 })
  detectionMethod: string;

  @Column({ length: 100, nullable: true })
  autoResponse?: string;

  @Column({ default: false })
  isResolved: boolean;

  @Column('uuid', { nullable: true })
  resolvedBy?: string;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt?: Date;

  @Column({ default: false })
  falsePositive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  evidence?: any;

  @Column({ type: 'jsonb', nullable: true })
  impactAssessment?: any;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
