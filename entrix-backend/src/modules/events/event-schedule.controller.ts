import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { EventScheduleService } from './event-schedule.service';
import { CreateEventScheduleDto } from './dto/create-event-schedule.dto';
import { UpdateEventScheduleDto } from './dto/update-event-schedule.dto';

@ApiTags('Event Schedules')
@UseGuards(AuthGuard('jwt'))
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
@Controller('event-schedules')
export class EventScheduleController {
  constructor(private readonly eventScheduleService: EventScheduleService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new event schedule' })
  create(@Body() dto: CreateEventScheduleDto) {
    return this.eventScheduleService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all event schedules' })
  findAll() {
    return this.eventScheduleService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an event schedule by ID' })
  findOne(@Param('id') id: string) {
    return this.eventScheduleService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an event schedule' })
  update(@Param('id') id: string, @Body() dto: UpdateEventScheduleDto) {
    return this.eventScheduleService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an event schedule' })
  remove(@Param('id') id: string) {
    return this.eventScheduleService.remove(id);
  }
} 