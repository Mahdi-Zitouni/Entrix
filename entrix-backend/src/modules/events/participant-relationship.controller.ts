import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { ParticipantRelationshipService } from './participant-relationship.service';
import { CreateParticipantRelationshipDto } from './dto/create-participant-relationship.dto';
import { UpdateParticipantRelationshipDto } from './dto/update-participant-relationship.dto';

@Controller('participant-relationships')
export class ParticipantRelationshipController {
  constructor(
    private readonly participantRelationshipService: ParticipantRelationshipService,
  ) {}

  @Get()
  async findAll() {
    return this.participantRelationshipService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.participantRelationshipService.findOne(id);
  }

  @Post()
  async create(@Body() createDto: CreateParticipantRelationshipDto) {
    return this.participantRelationshipService.create(createDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateParticipantRelationshipDto,
  ) {
    return this.participantRelationshipService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.participantRelationshipService.remove(id);
    return { message: 'Participant relationship deleted successfully' };
  }
}
