import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Event } from '../events/event.entity';
import { TicketType } from './ticket-type.entity';

export enum PricingRuleType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  BULK_DISCOUNT = 'BULK_DISCOUNT',
  EARLY_BIRD = 'EARLY_BIRD',
  LOYALTY = 'LOYALTY',
  GROUP = 'GROUP',
  PROMOTIONAL = 'PROMOTIONAL',
  GEO_BASED = 'GEO_BASED',
  LAST_MINUTE = 'LAST_MINUTE',
  PROMO_CODE = 'PROMO_CODE',
  TIME_WINDOW = 'TIME_WINDOW',
}

@Entity('pricing_rules')
@Index(['code'])
@Index(['ruleType'])
@Index(['isActive'])
@Index(['validFrom', 'validUntil'])
@Index(['promoCode'])
export class PricingRules {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column({
    type: 'enum',
    enum: PricingRuleType,
  })
  ruleType: PricingRuleType;

  @ManyToOne(() => Event, { nullable: true })
  @JoinColumn({ name: 'event_id' })
  event: Event;

  @ManyToOne(() => TicketType, { nullable: true })
  @JoinColumn({ name: 'ticket_type_id' })
  ticketType: TicketType;

  @Column({ type: 'decimal', nullable: true })
  value: number;

  @Column({ nullable: true })
  promoCode: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp with time zone', nullable: true })
  validFrom: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  validUntil: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown>;

  @Column({ nullable: true })
  userGroupId: string;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
