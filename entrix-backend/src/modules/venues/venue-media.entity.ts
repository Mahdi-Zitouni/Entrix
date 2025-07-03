import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Venue } from './venue.entity';
import { VenueZone } from './venue-zone.entity';
import { Seat } from './seat.entity';
import { AccessPoint } from './access-point.entity';

@Entity('venue_media')
export class VenueMedia {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id: string;

  @ManyToOne(() => Venue, (venue) => venue.media, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  venue: Venue;

  @ManyToOne(() => VenueZone, (zone) => zone.media, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  zone: VenueZone;

  @ManyToOne(() => Seat, (seat) => seat.media, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  seat: Seat;

  @ManyToOne(() => AccessPoint, (ap) => ap.media, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  accessPoint: AccessPoint;

  @Column({ nullable: false })
  mediaType: string; // IMAGE, VIDEO, DOCUMENT, AUDIO, VR_360, PANORAMA

  @Column({ nullable: false })
  category: string; // SEAT_VIEW, ZONE_OVERVIEW, VENUE_OVERVIEW, etc.

  @Column({ nullable: false })
  url: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: false })
  isPublic: boolean;

  @Column({ default: false })
  isPrimary: boolean;

  @Column('text', { array: true, nullable: true })
  tags: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
