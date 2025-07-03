import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { VenueZone } from './venue-zone.entity';
import { VenueMedia } from './venue-media.entity';

export enum SeatTypeEnum {
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
  VIP = 'VIP',
  ACCESSIBLE = 'ACCESSIBLE',
  OBSTRUCTED = 'OBSTRUCTED',
}

export enum SeatStatusEnum {
  AVAILABLE = 'AVAILABLE',
  SOLD = 'SOLD',
  BLOCKED = 'BLOCKED',
  MAINTENANCE = 'MAINTENANCE',
}

@Entity('seats')
export class Seat {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id: string;

  @ManyToOne(() => VenueZone, (zone) => zone.seats, { onDelete: 'CASCADE' })
  zone: VenueZone;

  @Column({ unique: true })
  reference: string;

  @Column({ nullable: true })
  label: string;

  @Column({ nullable: true })
  row: string;

  @Column({ nullable: true })
  number: string;

  @Column({ nullable: true })
  section: string;

  @Column({
    type: 'enum',
    enum: SeatTypeEnum,
    default: SeatTypeEnum.STANDARD,
  })
  seatType: SeatTypeEnum;

  @Column({
    type: 'enum',
    enum: SeatStatusEnum,
    default: SeatStatusEnum.AVAILABLE,
  })
  status: SeatStatusEnum;

  @Column({ type: 'jsonb', nullable: true })
  coordinates: any;

  @OneToMany(() => VenueMedia, (media) => media.seat)
  media: VenueMedia[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
