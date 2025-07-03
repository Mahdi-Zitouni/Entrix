import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { EventStatsService } from './event-stats.service';
import { CreateEventStatsDto } from './dto/create-event-stats.dto';
import { UpdateEventStatsDto } from './dto/update-event-stats.dto';

@Controller('event-stats')
export class EventStatsController {
  constructor(private readonly eventStatsService: EventStatsService) {}

  @Get()
  async findAll() {
    return this.eventStatsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.eventStatsService.findOne(id);
  }

  @Post()
  async create(@Body() createDto: CreateEventStatsDto) {
    return this.eventStatsService.create(createDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateEventStatsDto,
  ) {
    return this.eventStatsService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.eventStatsService.remove(id);
    return { message: 'Event stats deleted successfully' };
  }

  @Get(':eventId/popularity')
  async getEventPopularity(@Param('eventId') eventId: string) {
    return this.eventStatsService.getEventPopularity(eventId);
  }
}
