import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { VenueMapping } from './venue-mapping.entity';
import { VenueService } from './venue-service.entity';
import { VenueMedia } from './venue-media.entity';

@Entity('venues')
export class Venue {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id: string; // CUID or UUID

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  address: string;

  @Column()
  city: string;

  @Column({ nullable: true })
  postalCode: string;

  @Column({ default: 'TN' })
  country: string;

  @Column({ type: 'float', nullable: true })
  latitude: number;

  @Column({ type: 'float', nullable: true })
  longitude: number;

  @Column()
  maxCapacity: number;

  @Column({ nullable: true })
  description: string;

  @Column('text', { array: true, nullable: true })
  images: string[];

  @Column('text', { array: true, nullable: true })
  globalServices: string[];

  @Column({ nullable: true })
  defaultMappingId: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => VenueMapping, (mapping) => mapping.venue)
  mappings: VenueMapping[];

  @OneToMany(() => VenueService, (service: VenueService) => service.venue)
  services: VenueService[];

  @OneToMany(() => VenueMedia, (media) => media.venue)
  media: VenueMedia[];
}
