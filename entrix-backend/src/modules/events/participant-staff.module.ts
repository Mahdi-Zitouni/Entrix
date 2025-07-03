import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParticipantStaff } from './participant-staff.entity';
import { ParticipantStaffService } from './participant-staff.service';
import { ParticipantStaffController } from './participant-staff.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ParticipantStaff])],
  providers: [ParticipantStaffService],
  controllers: [ParticipantStaffController],
  exports: [ParticipantStaffService],
})
export class ParticipantStaffModule {} 