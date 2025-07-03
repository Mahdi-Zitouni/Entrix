import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { Payment } from './payment.entity';
import { PaymentAttempt } from './payment-attempt.entity';
import { Refund } from './refund.entity';
import { ClubCommission } from './club-commission.entity';
import { PaymentWebhook } from './payment-webhook.entity';
import { PaymentMethod } from './payment-method.entity';
import { OrderService } from './order.service';
import { PaymentService } from './payment.service';
import { PaymentAttemptService } from './payment-attempt.service';
import { RefundService } from './refund.service';
import { ClubCommissionService } from './club-commission.service';
import { PaymentWebhookService } from './payment-webhook.service';
import { OrderController } from './order.controller';
import { PaymentController } from './payment.controller';
import { PaymentAttemptController } from './payment-attempt.controller';
import { RefundController } from './refund.controller';
import { ClubCommissionController } from './club-commission.controller';
import { PaymentWebhookController } from './payment-webhook.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { NotificationService } from '../notifications/notification.service';
import { OrderItemModule } from './order-item.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      Payment,
      PaymentAttempt,
      Refund,
      ClubCommission,
      PaymentWebhook,
      PaymentMethod,
    ]),
    NotificationsModule,
    OrderItemModule,
  ],
  controllers: [
    OrderController,
    PaymentController,
    PaymentAttemptController,
    RefundController,
    ClubCommissionController,
    PaymentWebhookController,
  ],
  providers: [
    OrderService,
    PaymentService,
    PaymentAttemptService,
    RefundService,
    ClubCommissionService,
    PaymentWebhookService,
  ],
  exports: [TypeOrmModule, OrderItemModule],
})
export class PaymentsModule {}
