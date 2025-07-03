import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Event } from '../events/event.entity';
import { Ticket } from '../ticketing/ticket.entity';
import { Venue } from '../venues/venue.entity';
import { User } from '../users/user.entity';
import { Order } from '../payments/order.entity';
import { Payment } from '../payments/payment.entity';
import { AccessControlLog } from '../ticketing/access-control-log.entity';
import { Refund } from '../payments/refund.entity';
import { AuditLog } from '../security/audit-log.entity';
import { Seat } from '../venues/seat.entity';
import { SecurityModule } from '../security/security.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Event,
      Ticket,
      Venue,
      User,
      Order,
      Payment,
      AccessControlLog,
      Refund,
      AuditLog,
      Seat,
    ]),
    SecurityModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {} 