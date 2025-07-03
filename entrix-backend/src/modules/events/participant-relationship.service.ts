import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParticipantRelationship } from './participant-relationship.entity';
import { CreateParticipantRelationshipDto } from './dto/create-participant-relationship.dto';
import { UpdateParticipantRelationshipDto } from './dto/update-participant-relationship.dto';

@Injectable()
export class ParticipantRelationshipService {
  constructor(
    @InjectRepository(ParticipantRelationship)
    private readonly participantRelationshipRepository: Repository<ParticipantRelationship>,
  ) {}

  async findAll(): Promise<ParticipantRelationship[]> {
    return this.participantRelationshipRepository.find();
  }

  async findOne(id: string): Promise<ParticipantRelationship> {
    const relationship = await this.participantRelationshipRepository.findOne({
      where: { id },
    });
    if (!relationship)
      throw new NotFoundException('Participant relationship not found');
    return relationship;
  }

  async create(
    createDto: CreateParticipantRelationshipDto,
  ): Promise<ParticipantRelationship> {
    const relationship =
      this.participantRelationshipRepository.create(createDto);
    return this.participantRelationshipRepository.save(relationship);
  }

  async update(
    id: string,
    updateDto: UpdateParticipantRelationshipDto,
  ): Promise<ParticipantRelationship> {
    const relationship = await this.findOne(id);
    Object.assign(relationship, updateDto);
    return this.participantRelationshipRepository.save(relationship);
  }

  async remove(id: string): Promise<void> {
    const relationship = await this.findOne(id);
    await this.participantRelationshipRepository.remove(relationship);
  }
}
