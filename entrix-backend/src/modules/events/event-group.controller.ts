import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { EventGroupService } from './event-group.service';
import { CreateEventGroupDto } from './dto/create-event-group.dto';
import { UpdateEventGroupDto } from './dto/update-event-group.dto';

@Controller('event-groups')
export class EventGroupController {
  constructor(private readonly eventGroupService: EventGroupService) {}

  @Get()
  async findAll() {
    return this.eventGroupService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.eventGroupService.findOne(id);
  }

  @Post()
  async create(@Body() createDto: CreateEventGroupDto) {
    return this.eventGroupService.create(createDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateEventGroupDto,
  ) {
    return this.eventGroupService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.eventGroupService.remove(id);
    return { message: 'Event group deleted successfully' };
  }
}
