import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('ticket_types')
export class TicketType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  code: string;

  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column('decimal', { precision: 10, scale: 2 })
  basePrice: number;

  @Column({ length: 3, default: 'TND' })
  currency: string;

  @Column({ default: true })
  transferable: boolean;

  @Column({ default: false })
  refundable: boolean;

  @Column({ type: 'int', default: 8 })
  maxQuantityPerOrder: number;

  @Column({ type: 'date', nullable: true })
  validFrom?: Date;

  @Column({ type: 'date', nullable: true })
  validUntil?: Date;

  @Column({ type: 'jsonb', nullable: true })
  benefits?: any;

  @Column({ type: 'jsonb', nullable: true })
  restrictions?: any;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
