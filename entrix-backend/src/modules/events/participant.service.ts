import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Participant } from './participant.entity';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';

@Injectable()
export class ParticipantService {
  constructor(
    @InjectRepository(Participant)
    private readonly participantRepository: Repository<Participant>,
  ) {}

  async findAll(): Promise<Participant[]> {
    return this.participantRepository.find();
  }

  async findOne(id: string): Promise<Participant> {
    const participant = await this.participantRepository.findOne({
      where: { id },
    });
    if (!participant) throw new NotFoundException('Participant not found');
    return participant;
  }

  async create(createDto: CreateParticipantDto): Promise<Participant> {
    const participant = this.participantRepository.create(createDto);
    return this.participantRepository.save(participant);
  }

  async update(
    id: string,
    updateDto: UpdateParticipantDto,
  ): Promise<Participant> {
    const participant = await this.findOne(id);
    Object.assign(participant, updateDto);
    return this.participantRepository.save(participant);
  }

  async remove(id: string): Promise<void> {
    const participant = await this.findOne(id);
    await this.participantRepository.remove(participant);
  }
}
