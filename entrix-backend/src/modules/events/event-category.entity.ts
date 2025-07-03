import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('event_categories')
export class EventCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  parentCategoryId: string;

  @Column({ nullable: true })
  defaultDuration: number;

  @Column({ nullable: true })
  defaultCapacity: number;

  @Column({ default: false })
  requiresReferee: boolean;

  @Column({ default: false })
  allowsDraw: boolean;

  @Column({ default: false })
  hasOvertime: boolean;

  @Column({ default: false })
  hasPenalties: boolean;

  @Column({ nullable: true })
  iconUrl: string;

  @Column({ nullable: true })
  colorPrimary: string;

  @Column({ nullable: true })
  colorSecondary: string;

  @Column({ type: 'decimal', nullable: true })
  defaultTicketPrice: number;

  @Column({ default: 'TND' })
  currency: string;

  @Column({ type: 'jsonb', nullable: true })
  rules: any;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  displayOrder: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
