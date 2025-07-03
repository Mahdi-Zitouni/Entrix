import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Venue } from './venue.entity';
import { VenueZone } from './venue-zone.entity';

export enum MappingTypeEnum {
  DEFAULT = 'DEFAULT',
  EVENT_SPECIFIC = 'EVENT_SPECIFIC',
  SEASONAL = 'SEASONAL',
  MAINTENANCE = 'MAINTENANCE',
}

@Entity('venue_mappings')
export class VenueMapping {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id: string;

  @ManyToOne(() => Venue, (venue) => venue.mappings, { onDelete: 'CASCADE' })
  venue: Venue;

  @Column()
  name: string;

  @Column()
  code: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: MappingTypeEnum,
    default: MappingTypeEnum.DEFAULT,
  })
  mappingType: MappingTypeEnum;

  @Column('text', { array: true, nullable: true })
  eventCategories: string[];

  @Column()
  effectiveCapacity: number;

  @Column({ type: 'timestamptz', nullable: true })
  validFrom: Date;

  @Column({ type: 'timestamptz', nullable: true })
  validUntil: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => VenueZone, (zone) => zone.mapping)
  zones: VenueZone[];
}
