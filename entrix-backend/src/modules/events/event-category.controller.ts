import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { EventCategoryService } from './event-category.service';
import { CreateEventCategoryDto } from './dto/create-event-category.dto';
import { UpdateEventCategoryDto } from './dto/update-event-category.dto';

@Controller('event-categories')
export class EventCategoryController {
  constructor(private readonly eventCategoryService: EventCategoryService) {}

  @Get()
  async findAll() {
    return this.eventCategoryService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.eventCategoryService.findOne(id);
  }

  @Post()
  async create(@Body() createDto: CreateEventCategoryDto) {
    return this.eventCategoryService.create(createDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateEventCategoryDto,
  ) {
    return this.eventCategoryService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.eventCategoryService.remove(id);
    return { message: 'Event category deleted successfully' };
  }
}
