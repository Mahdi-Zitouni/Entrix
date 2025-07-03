import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ValidationPipe,
  Request,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { VenuesService } from './venues.service';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { SetSeatMapDto } from './dto/set-seat-map.dto';
import { ApiBody, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('venues')
@Controller('venues')
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all venues with optional filtering' })
  @ApiQuery({ name: 'city', required: false, description: 'Filter by city' })
  @ApiQuery({ name: 'capacity', required: false, description: 'Filter by minimum capacity' })
  @ApiQuery({ name: 'services', required: false, description: 'Filter by services (comma-separated)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in name and description' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  async findAll(
    @Query('city') city?: string,
    @Query('capacity') capacity?: number,
    @Query('services') services?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.venuesService.findAll({
      city,
      capacity,
      services: services ? services.split(',') : undefined,
      search,
      page: page || 1,
      limit: limit || 20,
    });
  }

  @Get('search')
  @ApiOperation({ summary: 'Advanced venue search' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'filters', required: false, description: 'JSON filters' })
  async searchVenues(
    @Query('q') query: string,
    @Query('filters') filters?: string,
  ) {
    const parsedFilters = filters ? JSON.parse(filters) : {};
    return this.venuesService.searchVenues(query, parsedFilters);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find venues near a location' })
  @ApiQuery({ name: 'lat', required: true, description: 'Latitude' })
  @ApiQuery({ name: 'lng', required: true, description: 'Longitude' })
  @ApiQuery({ name: 'radius', required: false, description: 'Search radius in km' })
  async findNearbyVenues(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius?: number,
  ) {
    return this.venuesService.findNearbyVenues(lat, lng, radius || 50);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get venue by ID' })
  @ApiResponse({ status: 200, description: 'Venue found' })
  @ApiResponse({ status: 404, description: 'Venue not found' })
  async findOne(@Param('id') id: string) {
    return this.venuesService.findOne(id);
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Check venue availability' })
  @ApiQuery({ name: 'from', required: true, description: 'Start date' })
  @ApiQuery({ name: 'to', required: true, description: 'End date' })
  async checkAvailability(
    @Param('id') id: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.venuesService.checkAvailability(id, new Date(from), new Date(to));
  }

  @Get(':id/capacity')
  @ApiOperation({ summary: 'Get venue capacity information' })
  async getCapacityInfo(@Param('id') id: string) {
    return this.venuesService.getCapacityInfo(id);
  }

  @Get(':id/services')
  @ApiOperation({ summary: 'Get venue services' })
  async getVenueServices(@Param('id') id: string) {
    return this.venuesService.getVenueServices(id);
  }

  @Get(':id/media')
  @ApiOperation({ summary: 'Get venue media' })
  async getVenueMedia(@Param('id') id: string) {
    return this.venuesService.getVenueMedia(id);
  }

  @Get(':id/mappings')
  @ApiOperation({ summary: 'Get venue mappings' })
  async getVenueMappings(@Param('id') id: string) {
    return this.venuesService.getVenueMappings(id);
  }

  @Get(':id/zones')
  @ApiOperation({ summary: 'Get venue zones' })
  @ApiQuery({ name: 'mappingId', required: false, description: 'Filter by mapping ID' })
  async getVenueZones(
    @Param('id') id: string,
    @Query('mappingId') mappingId?: string,
  ) {
    return this.venuesService.getVenueZones(id, mappingId);
  }

  @Get(':id/access-points')
  @ApiOperation({ summary: 'Get venue access points' })
  async getAccessPoints(@Param('id') id: string) {
    return this.venuesService.getAccessPoints(id);
  }

  @Get(':id/utilization-report')
  @ApiOperation({ summary: 'Get venue utilization report' })
  @ApiQuery({ name: 'from', required: false, description: 'Start date' })
  @ApiQuery({ name: 'to', required: false, description: 'End date' })
  async getUtilizationReport(
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.venuesService.getUtilizationReport(id, {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get(':id/seat-map')
  @ApiOperation({ summary: 'Get venue seat map' })
  async getSeatMap(@Param('id') id: string) {
    return this.venuesService.getSeatMap(id);
  }

  @Get(':id/effective-seat-map')
  @ApiOperation({ summary: 'Get effective seat map for specific event/date' })
  @ApiQuery({ name: 'eventId', required: false, description: 'Event ID' })
  @ApiQuery({ name: 'date', required: false, description: 'Date' })
  async getEffectiveSeatMap(
    @Param('id') id: string,
    @Query('eventId') eventId?: string,
    @Query('date') date?: string,
  ) {
    return this.venuesService.getEffectiveSeatMap(id, eventId, date ? new Date(date) : undefined);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'venue_manager')
  @ApiOperation({ summary: 'Create new venue' })
  @ApiBody({ type: CreateVenueDto })
  @ApiResponse({ status: 201, description: 'Venue created' })
  async create(
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) createVenueDto: CreateVenueDto,
    @Request() req: any,
  ) {
    return this.venuesService.create(createVenueDto, req.user.id);
  }

  @Post(':id/media')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'venue_manager')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload venue media' })
  async uploadMedia(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { type: string; description?: string },
  ) {
    return this.venuesService.uploadMedia(id, file, body);
  }

  @Post(':id/mappings')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'venue_manager')
  @ApiOperation({ summary: 'Create venue mapping' })
  async createMapping(
    @Param('id') id: string,
    @Body() mappingData: any,
  ) {
    return this.venuesService.createMapping(id, mappingData);
  }

  @Post(':id/zones')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'venue_manager')
  @ApiOperation({ summary: 'Create venue zone' })
  async createZone(
    @Param('id') id: string,
    @Body() zoneData: any,
  ) {
    return this.venuesService.createZone(id, zoneData);
  }

  @Post(':id/access-points')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'venue_manager')
  @ApiOperation({ summary: 'Create access point' })
  async createAccessPoint(
    @Param('id') id: string,
    @Body() accessPointData: any,
  ) {
    return this.venuesService.createAccessPoint(id, accessPointData);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'venue_manager')
  @ApiOperation({ summary: 'Update venue' })
  @ApiBody({ type: UpdateVenueDto })
  async update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) updateVenueDto: UpdateVenueDto,
    @Request() req: any,
  ) {
    return this.venuesService.update(id, updateVenueDto, req.user.id);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'venue_manager')
  @ApiOperation({ summary: 'Update venue status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { isActive: boolean; reason?: string },
    @Request() req: any,
  ) {
    return this.venuesService.updateStatus(id, body.isActive, body.reason, req.user.id);
  }

  @Put(':id/capacity')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'venue_manager')
  @ApiOperation({ summary: 'Update venue capacity' })
  async updateCapacity(
    @Param('id') id: string,
    @Body() body: { maxCapacity: number; reason?: string },
    @Request() req: any,
  ) {
    return this.venuesService.updateCapacity(id, body.maxCapacity, body.reason, req.user.id);
  }

  @Post(':id/seat-map')
  @ApiOperation({ summary: 'Update the seat/zone map for a venue' })
  @ApiBody({ type: SetSeatMapDto })
  @ApiResponse({ status: 200, description: 'Seat map updated' })
  @Roles('ADMIN', 'venue_manager')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async setSeatMap(
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) map: SetSeatMapDto,
    @Request() req: any,
  ) {
    const userId = (req as any).user?.id;
    return this.venuesService.setSeatMap(id, map, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete venue' })
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.venuesService.remove(id, req.user.id);
    return { message: 'Venue deleted successfully' };
  }

  @Delete(':id/media/:mediaId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'venue_manager')
  @ApiOperation({ summary: 'Delete venue media' })
  async removeMedia(
    @Param('id') id: string,
    @Param('mediaId') mediaId: string,
  ) {
    return this.venuesService.removeMedia(id, mediaId);
  }

  @Delete(':id/mappings/:mappingId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'venue_manager')
  @ApiOperation({ summary: 'Delete venue mapping' })
  async removeMapping(
    @Param('id') id: string,
    @Param('mappingId') mappingId: string,
  ) {
    return this.venuesService.removeMapping(id, mappingId);
  }

  @Get('analytics/overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'analyst')
  @ApiOperation({ summary: 'Get venues analytics overview' })
  async getAnalyticsOverview(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.venuesService.getAnalyticsOverview({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('analytics/utilization')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'analyst')
  @ApiOperation({ summary: 'Get venue utilization analytics' })
  async getUtilizationAnalytics(
    @Query('period') period: string = 'month',
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.venuesService.getUtilizationAnalytics(period, {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }
}