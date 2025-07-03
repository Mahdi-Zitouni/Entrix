import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { EventParticipantService } from './event-participant.service';
import { CreateEventParticipantDto } from './dto/create-event-participant.dto';
import { UpdateEventParticipantDto } from './dto/update-event-participant.dto';

@Controller('event-participants')
export class EventParticipantController {
  constructor(
    private readonly eventParticipantService: EventParticipantService,
  ) {}

  @Get()
  async findAll() {
    return this.eventParticipantService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.eventParticipantService.findOne(id);
  }

  @Post()
  async create(@Body() createDto: CreateEventParticipantDto) {
    return this.eventParticipantService.create(createDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateEventParticipantDto,
  ) {
    return this.eventParticipantService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.eventParticipantService.remove(id);
    return { message: 'Event participant deleted successfully' };
  }
}
