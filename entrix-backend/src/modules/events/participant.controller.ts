import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { ParticipantService } from './participant.service';
import { CreateParticipantDto } from './dto/create-participant.dto';
import { UpdateParticipantDto } from './dto/update-participant.dto';

@Controller('participants')
export class ParticipantController {
  constructor(private readonly participantService: ParticipantService) {}

  @Get()
  async findAll() {
    return this.participantService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.participantService.findOne(id);
  }

  @Post()
  async create(@Body() createDto: CreateParticipantDto) {
    return this.participantService.create(createDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateParticipantDto,
  ) {
    return this.participantService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.participantService.remove(id);
    return { message: 'Participant deleted successfully' };
  }
}
