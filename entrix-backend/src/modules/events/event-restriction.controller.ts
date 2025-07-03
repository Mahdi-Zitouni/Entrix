import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { EventRestrictionService } from './event-restriction.service';
import { CreateEventRestrictionDto } from './dto/create-event-restriction.dto';
import { UpdateEventRestrictionDto } from './dto/update-event-restriction.dto';

@ApiTags('Event Restrictions')
@UseGuards(AuthGuard('jwt'))
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
@Controller('event-restrictions')
export class EventRestrictionController {
  constructor(private readonly eventRestrictionService: EventRestrictionService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new event restriction' })
  create(@Body() dto: CreateEventRestrictionDto) {
    return this.eventRestrictionService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all event restrictions' })
  findAll() {
    return this.eventRestrictionService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an event restriction by ID' })
  findOne(@Param('id') id: string) {
    return this.eventRestrictionService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an event restriction' })
  update(@Param('id') id: string, @Body() dto: UpdateEventRestrictionDto) {
    return this.eventRestrictionService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an event restriction' })
  remove(@Param('id') id: string) {
    return this.eventRestrictionService.remove(id);
  }
} 