import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all events with optional filtering' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by event status' })
  @ApiQuery({ name: 'categoryId', required: false, description: 'Filter by event category' })
  @ApiQuery({ name: 'venueId', required: false, description: 'Filter by venue' })
  @ApiQuery({ name: 'from', required: false, description: 'Filter events from date' })
  @ApiQuery({ name: 'to', required: false, description: 'Filter events to date' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in title and description' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  async findAll(
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: string,
    @Query('venueId') venueId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.eventsService.findAll({
      status,
      categoryId,
      venueId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      search,
      page: page || 1,
      limit: limit || 20,
    });
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming events' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of events to return' })
  async getUpcomingEvents(@Query('limit') limit?: number) {
    return this.eventsService.getUpcomingEvents(limit || 10);
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular events based on ticket sales' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of events to return' })
  async getPopularEvents(@Query('limit') limit?: number) {
    return this.eventsService.getPopularEvents(limit || 10);
  }

  @Get('search')
  @ApiOperation({ summary: 'Advanced event search' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'filters', required: false, description: 'JSON filters' })
  async searchEvents(
    @Query('q') query: string,
    @Query('filters') filters?: string,
  ) {
    const parsedFilters = filters ? JSON.parse(filters) : {};
    return this.eventsService.searchEvents(query, parsedFilters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiResponse({ status: 200, description: 'Event found' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Get(':id/statistics')
  @ApiOperation({ summary: 'Get event statistics' })
  async getEventStatistics(@Param('id') id: string) {
    return this.eventsService.getEventStatistics(id);
  }

  @Get(':id/participants')
  @ApiOperation({ summary: 'Get event participants' })
  @ApiQuery({ name: 'role', required: false, description: 'Filter by participant role' })
  async getEventParticipants(
    @Param('id') id: string,
    @Query('role') role?: string,
  ) {
    return this.eventsService.getEventParticipants(id, role);
  }

  @Get(':id/media')
  @ApiOperation({ summary: 'Get event media' })
  async getEventMedia(@Param('id') id: string) {
    return this.eventsService.getEventMedia(id);
  }

  @Get(':id/schedule')
  @ApiOperation({ summary: 'Get event schedule' })
  async getEventSchedule(@Param('id') id: string) {
    return this.eventsService.getEventSchedule(id);
  }

  @Get(':id/restrictions')
  @ApiOperation({ summary: 'Get event restrictions' })
  async getEventRestrictions(@Param('id') id: string) {
    return this.eventsService.getEventRestrictions(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'event_manager')
  @ApiOperation({ summary: 'Create new event' })
  @ApiBody({ type: CreateEventDto })
  @ApiResponse({ status: 201, description: 'Event created' })
  async create(
    @Body() createEventDto: CreateEventDto,
    @Request() req: any,
  ) {
    return this.eventsService.create(createEventDto, req.user.id);
  }

  @Post(':id/media')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'event_manager')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload event media' })
  async uploadMedia(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { type: string; description?: string },
  ) {
    return this.eventsService.uploadMedia(id, file, body);
  }

  @Post(':id/participants')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'event_manager')
  @ApiOperation({ summary: 'Add participant to event' })
  async addParticipant(
    @Param('id') id: string,
    @Body() body: { participantId: string; role: string; details?: any },
  ) {
    return this.eventsService.addParticipant(id, body);
  }

  @Post(':id/schedule')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'event_manager')
  @ApiOperation({ summary: 'Create event schedule' })
  async createSchedule(
    @Param('id') id: string,
    @Body() scheduleData: any,
  ) {
    return this.eventsService.createSchedule(id, scheduleData);
  }

  @Post(':id/restrictions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'event_manager')
  @ApiOperation({ summary: 'Add event restriction' })
  async addRestriction(
    @Param('id') id: string,
    @Body() restrictionData: any,
  ) {
    return this.eventsService.addRestriction(id, restrictionData);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'event_manager')
  @ApiOperation({ summary: 'Update event' })
  @ApiBody({ type: UpdateEventDto })
  async update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @Request() req: any,
  ) {
    return this.eventsService.update(id, updateEventDto, req.user.id);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'event_manager')
  @ApiOperation({ summary: 'Update event status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; reason?: string },
    @Request() req: any,
  ) {
    return this.eventsService.updateStatus(id, body.status, body.reason, req.user.id);
  }

  @Put(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'event_manager')
  @ApiOperation({ summary: 'Publish event' })
  async publishEvent(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.eventsService.publishEvent(id, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Delete event' })
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.eventsService.remove(id, req.user.id);
    return { message: 'Event deleted successfully' };
  }

  @Delete(':id/media/:mediaId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'event_manager')
  @ApiOperation({ summary: 'Delete event media' })
  async removeMedia(
    @Param('id') id: string,
    @Param('mediaId') mediaId: string,
  ) {
    return this.eventsService.removeMedia(id, mediaId);
  }

  @Delete(':id/participants/:participantId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'event_manager')
  @ApiOperation({ summary: 'Remove participant from event' })
  async removeParticipant(
    @Param('id') id: string,
    @Param('participantId') participantId: string,
  ) {
    return this.eventsService.removeParticipant(id, participantId);
  }

  @Get('analytics/overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Get events analytics overview' })
  async getAnalyticsOverview(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.eventsService.getAnalyticsOverview({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('analytics/trends')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Get event trends' })
  async getEventTrends(
    @Query('period') period: string = 'month',
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.eventsService.getEventTrends(period, {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }
}
