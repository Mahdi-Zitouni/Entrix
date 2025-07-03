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

export enum VenueServiceCategoryEnum {
  PARKING = 'PARKING',
  FOOD_BEVERAGE = 'FOOD_BEVERAGE',
  ENTERTAINMENT = 'ENTERTAINMENT',
  WIFI = 'WIFI',
  MERCHANDISE = 'MERCHANDISE',
  OTHER = 'OTHER',
}

@Entity('venue_services')
export class VenueService {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id: string;

  @ManyToOne(() => Venue, (venue) => venue.services, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  venue: Venue;

  @ManyToOne(() => VenueZone, (zone) => zone.services, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  zone: VenueZone;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: VenueServiceCategoryEnum,
    default: VenueServiceCategoryEnum.OTHER,
  })
  category: VenueServiceCategoryEnum;

  @Column({ default: false })
  isIncludedInPrice: boolean;

  @Column({ type: 'decimal', nullable: true })
  additionalCost: number;

  @Column({ nullable: true })
  capacity: number;

  @Column({ type: 'jsonb', nullable: true })
  operatingHours: Record<string, unknown>;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
