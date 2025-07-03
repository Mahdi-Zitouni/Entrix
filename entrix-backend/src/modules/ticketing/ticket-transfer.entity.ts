import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Ticket } from './ticket.entity';

export enum TicketTransferStatus {
  LISTED = 'LISTED',
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum EscrowStatus {
  NONE = 'NONE',
  HELD = 'HELD',
  RELEASED = 'RELEASED',
  REFUNDED = 'REFUNDED',
}

@Entity('ticket_transfers')
export class TicketTransfer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Ticket, { nullable: false })
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;

  @Column({ type: 'uuid' })
  sellerId: string;

  @Column({ type: 'uuid', nullable: true })
  buyerId: string;

  @Column({ type: 'uuid', nullable: true })
  listedBy?: string;

  @Column({
    type: 'enum',
    enum: TicketTransferStatus,
    default: TicketTransferStatus.LISTED,
  })
  status: TicketTransferStatus;

  @Column({ type: 'decimal', nullable: false })
  price: number;

  @Column({ type: 'decimal', nullable: true })
  commission: number;

  @Column({
    type: 'enum',
    enum: EscrowStatus,
    default: EscrowStatus.NONE,
  })
  escrowStatus: EscrowStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cancelReason?: string;

  @Column({ type: 'timestamptz', nullable: true })
  approvedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  approvedBy?: string;

  @Column({ type: 'timestamptz', nullable: true })
  rejectedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  rejectedBy?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  rejectionReason?: string;

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  cancelledBy?: string;
}
