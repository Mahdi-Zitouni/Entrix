import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum TicketTransferStatus {
  NONE = 'NONE',
  LISTED = 'LISTED',
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 50 })
  ticketNumber: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  eventId: string;

  @Column('uuid', { nullable: true })
  seatId?: string;

  @Column('uuid', { nullable: true })
  ticketTypeId?: string;

  @Column('uuid', { nullable: true })
  subscriptionId?: string;

  @Column('decimal', { precision: 10, scale: 2 })
  pricePaid: number;

  @Column('uuid', { nullable: true })
  paymentId?: string;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  paymentStatus: string;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  bookingStatus: string;

  @Column({ default: false })
  isGuestPurchase: boolean;

  @Column({ type: 'varchar', length: 200, nullable: true })
  guestEmail?: string;

  @Column({ type: 'jsonb', nullable: true })
  guestInfo?: any;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;

  @Column('uuid', { nullable: true })
  createdBy?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Column({ default: false })
  isTransferable: boolean;

  @Column({
    type: 'enum',
    enum: TicketTransferStatus,
    default: TicketTransferStatus.NONE,
  })
  transferStatus: TicketTransferStatus;

  @Column({ type: 'decimal', nullable: true })
  transferPrice: number;

  @Column({ type: 'decimal', nullable: true })
  transferCommission: number;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status: string;

  @Column({ type: 'timestamptz', nullable: true })
  usedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  usedBy?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  accessPoint?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  statusReason?: string;

  @Column({ type: 'timestamptz', nullable: true })
  statusUpdatedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  statusUpdatedBy?: string;
}
