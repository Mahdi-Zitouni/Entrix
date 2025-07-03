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
import { VenueMedia } from './venue-media.entity';

export enum AccessTypeEnum {
  MAIN_ENTRANCE = 'MAIN_ENTRANCE',
  VIP_ENTRANCE = 'VIP_ENTRANCE',
  STAFF_ENTRANCE = 'STAFF_ENTRANCE',
  EMERGENCY_EXIT = 'EMERGENCY_EXIT',
  SERVICE_ENTRANCE = 'SERVICE_ENTRANCE',
}

@Entity('access_points')
export class AccessPoint {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id: string;

  @ManyToOne(() => VenueMapping, (mapping) => mapping.zones, {
    onDelete: 'CASCADE',
  })
  mapping: VenueMapping;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: AccessTypeEnum,
    default: AccessTypeEnum.MAIN_ENTRANCE,
  })
  accessType: AccessTypeEnum;

  @Column({ type: 'float', nullable: true })
  latitude: number;

  @Column({ type: 'float', nullable: true })
  longitude: number;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => VenueMedia, (media) => media.accessPoint)
  media: VenueMedia[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
