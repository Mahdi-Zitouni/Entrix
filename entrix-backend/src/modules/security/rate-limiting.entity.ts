import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('rate_limiting')
export class RateLimiting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  identifier: string;

  @Column({ length: 20 })
  identifierType: string;

  @Column({ length: 200 })
  endpoint: string;

  @Column({ type: 'int', default: 0 })
  requestCount: number;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  lastRequest: Date;

  @Column({ default: false })
  isBlocked: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  blockedUntil?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
