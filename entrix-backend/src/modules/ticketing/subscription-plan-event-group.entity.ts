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
import { SubscriptionPlan } from './subscription-plan.entity';
import { EventGroup } from '../events/event-group.entity';

@Entity('subscription_plan_event_groups')
@Index(['subscriptionPlan'])
@Index(['eventGroup'])
export class SubscriptionPlanEventGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SubscriptionPlan, { nullable: false })
  @JoinColumn({ name: 'subscription_plan_id' })
  subscriptionPlan: SubscriptionPlan;

  @ManyToOne(() => EventGroup, { nullable: false })
  @JoinColumn({ name: 'event_group_id' })
  eventGroup: EventGroup;

  @Column({ nullable: true })
  accessLevel: string;

  @Column({ type: 'text', array: true, nullable: true })
  includedMatchTypes: string[];

  @Column({ type: 'uuid', array: true, nullable: true })
  excludedEvents: string[];

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
