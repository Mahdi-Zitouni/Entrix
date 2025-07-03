import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Event } from '../events/event.entity';
import { Venue } from './venue.entity';
import { VenueZone } from './venue-zone.entity';
import { Seat } from './seat.entity';

export enum OverrideType {
  VENUE = 'VENUE',
  ZONE = 'ZONE',
  SEAT = 'SEAT',
}

@Entity('zone_mapping_override')
export class ZoneMappingOverride {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Event, { nullable: true })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @ManyToOne(() => Venue, { nullable: true })
  @JoinColumn({ name: 'venue_id' })
  venue: Venue;

  @ManyToOne(() => VenueZone, { nullable: true })
  @JoinColumn({ name: 'zone_id' })
  zone: VenueZone;

  @ManyToOne(() => Seat, { nullable: true })
  @JoinColumn({ name: 'seat_id' })
  seat: Seat;

  @Column({ type: 'enum', enum: OverrideType })
  overrideType: OverrideType;

  @Column({ type: 'jsonb' })
  overrideData: Record<string, unknown>;

  @Column({ type: 'timestamp with time zone', nullable: true })
  effectiveFrom: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  effectiveTo: Date;

  @Column({ nullable: true })
  reason: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: true })
  requiresNotification: boolean;

  @Column({ default: false })
  notificationSent: boolean;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
