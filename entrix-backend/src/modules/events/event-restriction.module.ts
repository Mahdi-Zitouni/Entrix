import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventRestriction } from './event-restriction.entity';
import { EventRestrictionService } from './event-restriction.service';
import { EventRestrictionController } from './event-restriction.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EventRestriction])],
  providers: [EventRestrictionService],
  controllers: [EventRestrictionController],
  exports: [EventRestrictionService],
})
export class EventRestrictionModule {} 