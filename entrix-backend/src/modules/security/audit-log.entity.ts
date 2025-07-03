import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  action: string;

  @Column({ type: 'varchar', length: 100 })
  entityType: string;

  @Column('uuid', { nullable: true })
  entityId?: string;

  @Column('uuid', { nullable: true })
  userId?: string;

  @Column('uuid', { nullable: true })
  sessionId?: string;

  @Column({ type: 'inet', nullable: true })
  ipAddress?: string;

  @Column({ type: 'text', nullable: true })
  userAgent?: string;

  @Column({ type: 'jsonb', nullable: true })
  oldValues?: any;

  @Column({ type: 'jsonb', nullable: true })
  newValues?: any;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;

  @Column({ type: 'varchar', length: 10, default: 'MEDIUM' })
  severity: string;

  @Column({ default: true })
  success: boolean;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ type: 'int', nullable: true })
  durationMs?: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
