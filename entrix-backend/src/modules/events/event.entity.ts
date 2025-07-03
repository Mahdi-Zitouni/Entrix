import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  status: string; // DRAFT, SCHEDULED, CONFIRMED, LIVE, FINISHED, CANCELLED, POSTPONED, SUSPENDED

  @Column()
  visibility: string; // PUBLIC, PRIVATE, MEMBERS_ONLY, VIP_ONLY, STAFF_ONLY

  @Column({ nullable: true })
  categoryId: string;

  @Column({ nullable: true })
  groupId: string;

  @Column({ nullable: true })
  venueId: string;

  @Column({ type: 'timestamptz', nullable: true })
  scheduledStart: Date;

  @Column({ type: 'timestamptz', nullable: true })
  scheduledEnd: Date;

  @Column({ type: 'timestamptz', nullable: true })
  salesStart: Date;

  @Column({ type: 'timestamptz', nullable: true })
  salesEnd: Date;

  @Column('text', { array: true, nullable: true })
  tags: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
