import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { EventMediaService } from './event-media.service';
import { CreateEventMediaDto } from './dto/create-event-media.dto';
import { UpdateEventMediaDto } from './dto/update-event-media.dto';

@Controller('event-media')
export class EventMediaController {
  constructor(private readonly eventMediaService: EventMediaService) {}

  @Get()
  async findAll() {
    return this.eventMediaService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.eventMediaService.findOne(id);
  }

  @Post()
  async create(@Body() createDto: CreateEventMediaDto) {
    return this.eventMediaService.create(createDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateEventMediaDto,
  ) {
    return this.eventMediaService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.eventMediaService.remove(id);
    return { message: 'Event media deleted successfully' };
  }
}
