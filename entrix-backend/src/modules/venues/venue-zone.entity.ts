import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { VenueMapping } from './venue-mapping.entity';
import { Seat } from './seat.entity';
import { VenueService } from './venue-service.entity';
import { VenueMedia } from './venue-media.entity';

export enum ZoneTypeEnum {
  SEATING_AREA = 'SEATING_AREA',
  STANDING_AREA = 'STANDING_AREA',
  VIP_AREA = 'VIP_AREA',
  SERVICE_AREA = 'SERVICE_AREA',
}

export enum ZoneCategoryEnum {
  STANDARD = 'STANDARD',
  VIP = 'VIP',
  FAMILY = 'FAMILY',
  PRESS = 'PRESS',
  ACCESSIBLE = 'ACCESSIBLE',
}

@Entity('venue_zones')
export class VenueZone {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id: string;

  @ManyToOne(() => VenueMapping, (mapping) => mapping.zones, {
    onDelete: 'CASCADE',
  })
  mapping: VenueMapping;

  @ManyToOne(() => VenueZone, (zone) => zone.children, { nullable: true })
  parentZone: VenueZone;

  @OneToMany(() => VenueZone, (zone) => zone.parentZone)
  children: VenueZone[];

  @Column()
  name: string;

  @Column()
  code: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: 1 })
  level: number;

  @Column({ default: 0 })
  displayOrder: number;

  @Column({
    type: 'enum',
    enum: ZoneTypeEnum,
    default: ZoneTypeEnum.SEATING_AREA,
  })
  zoneType: ZoneTypeEnum;

  @Column({
    type: 'enum',
    enum: ZoneCategoryEnum,
    default: ZoneCategoryEnum.STANDARD,
  })
  category: ZoneCategoryEnum;

  @Column()
  capacity: number;

  @Column({ default: false })
  hasSeats: boolean;

  @Column({ nullable: true })
  seatLayout: string;

  @Column({ nullable: true })
  details: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => VenueService, (service) => service.zone)
  services: VenueService[];

  @OneToMany(() => VenueMedia, (media) => media.zone)
  media: VenueMedia[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Seat, (seat) => seat.zone)
  seats: Seat[];
}
