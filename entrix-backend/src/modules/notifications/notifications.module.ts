import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationPreferenceService } from './notification-preference.service';
import { NotificationPreference } from './notification-preference.entity';
import { NotificationTemplate } from './notification-template.entity';
import { ScheduledNotification } from './scheduled-notification.entity';
import { NotificationHistory } from './notification-history.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotificationPreference,
      NotificationTemplate,
      ScheduledNotification,
      NotificationHistory,
    ]),
    UsersModule,
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationPreferenceService],
  exports: [NotificationService, NotificationPreferenceService],
})
export class NotificationsModule {}
