import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Venue } from './venue.entity';
import { VenueMapping } from './venue-mapping.entity';
import { VenueZone } from './venue-zone.entity';
import { Seat } from './seat.entity';
import { AccessPoint } from './access-point.entity';
import { VenueMedia } from './venue-media.entity';
import { VenueService } from './venue-service.entity';
import { VenuesService } from './venues.service';
import { VenuesController } from './venues.controller';
import { ZoneMappingOverride } from './zone-mapping-override.entity';
import { ZoneMappingOverrideService } from './zone-mapping-override.service';
import { ZoneMappingOverrideController } from './zone-mapping-override.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { SecurityModule } from '../security/security.module';
import { Event } from '../events/event.entity';
import { Ticket } from '../ticketing/ticket.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Venue,
      VenueMapping,
      VenueZone,
      Seat,
      AccessPoint,
      VenueMedia,
      VenueService,
      ZoneMappingOverride,
      Event,
      Ticket,
    ]),
    NotificationsModule,
    SecurityModule,
  ],
  controllers: [VenuesController, ZoneMappingOverrideController],
  providers: [VenuesService, ZoneMappingOverrideService],
  exports: [VenuesService],
})
export class VenuesModule {}
