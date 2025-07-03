import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Event } from '../events/event.entity';
import { TicketType } from './ticket-type.entity';

@Entity('event_ticket_config')
@Index(['event'])
@Index(['ticketType'])
export class EventTicketConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Event, { nullable: false })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @ManyToOne(() => TicketType, { nullable: false })
  @JoinColumn({ name: 'ticket_type_id' })
  ticketType: TicketType;

  @Column({ type: 'decimal', nullable: false })
  price: number;

  @Column({ type: 'integer', nullable: false })
  quantityAvailable: number;

  @Column({ type: 'integer', nullable: true })
  maxPerUser: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  salesStart: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  salesEnd: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
