import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParticipantStaff } from './participant-staff.entity';
import { CreateParticipantStaffDto } from './dto/create-participant-staff.dto';
import { UpdateParticipantStaffDto } from './dto/update-participant-staff.dto';

@Injectable()
export class ParticipantStaffService {
  private readonly logger = new Logger(ParticipantStaffService.name);

  constructor(
    @InjectRepository(ParticipantStaff)
    private readonly participantStaffRepository: Repository<ParticipantStaff>,
  ) {}

  create(dto: CreateParticipantStaffDto) {
    this.logger.log(`Creating participant staff for participant ${dto.participantId}`);
    const staff = this.participantStaffRepository.create(dto);
    return this.participantStaffRepository.save(staff);
  }

  findAll() {
    return this.participantStaffRepository.find();
  }

  findOne(id: string) {
    return this.participantStaffRepository.findOne({ where: { id } });
  }

  update(id: string, dto: UpdateParticipantStaffDto) {
    this.logger.log(`Updating participant staff ${id}`);
    return this.participantStaffRepository.update(id, dto);
  }

  remove(id: string) {
    this.logger.log(`Deleting participant staff ${id}`);
    return this.participantStaffRepository.delete(id);
  }

  // Add business logic methods as needed
} 