import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubscriptionPlan } from './subscription-plan.entity';
import { TicketType } from './ticket-type.entity';
import { Subscription } from './subscription.entity';
import { Ticket } from './ticket.entity';
import { SubscriptionPlanEventGroup } from './subscription-plan-event-group.entity';
import { SubscriptionPlanEvent } from './subscription-plan-event.entity';
import { SubscriptionPlanZone } from './subscription-plan-zone.entity';
import { SubscriptionPlanService } from './subscription-plan.service';
import { SubscriptionPlanController } from './subscription-plan.controller';
import { TicketTypeService } from './ticket-type.service';
import { TicketTypeController } from './ticket-type.controller';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { TicketService } from './ticket.service';
import { TicketController } from './ticket.controller';
import { TicketTransfer } from './ticket-transfer.entity';
import { Blacklist } from './blacklist.entity';
import { BlacklistService } from './blacklist.service';
import { BlacklistController } from './blacklist.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { EventsModule } from '../events/events.module';
import { UsersModule } from '../users/users.module';
import { AccessRights } from './access-rights.entity';
import { PricingRules } from './pricing-rules.entity';
import { Event } from '../events/event.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SubscriptionPlan,
      TicketType,
      Subscription,
      Ticket,
      SubscriptionPlanEventGroup,
      SubscriptionPlanEvent,
      SubscriptionPlanZone,
      TicketTransfer,
      Blacklist,
      AccessRights,
      PricingRules,
      Event,
      User,
    ]),
    NotificationsModule,
    EventsModule,
    UsersModule,
  ],
  providers: [
    SubscriptionPlanService,
    TicketTypeService,
    SubscriptionService,
    TicketService,
    BlacklistService,
  ],
  controllers: [
    SubscriptionPlanController,
    TicketTypeController,
    SubscriptionController,
    TicketController,
    BlacklistController,
  ],
  exports: [TicketService, BlacklistService],
})
export class TicketingModule {}
