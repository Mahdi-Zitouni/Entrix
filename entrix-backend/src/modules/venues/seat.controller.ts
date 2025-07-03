import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Param, 
  Body, 
  Query, 
  Res, 
  UseInterceptors, 
  UploadedFile,
  UseGuards,
  Request
} from '@nestjs/common';
import { SeatService } from './seat.service';
import { Seat } from './seat.entity';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import * as csvParse from 'csv-parse/sync';
// @ts-ignore
import { Parser as Json2CsvParser } from 'json2csv';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('Seats')
@Controller('seats')
export class SeatController {
  constructor(private readonly seatService: SeatService) {}

  @Get()
  @ApiOperation({ summary: 'Get all seats with optional filtering' })
  @ApiQuery({ name: 'venueId', required: false, description: 'Filter by venue ID' })
  @ApiQuery({ name: 'zoneId', required: false, description: 'Filter by zone ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by seat status' })
  @ApiQuery({ name: 'available', required: false, description: 'Filter by availability' })
  async findAll(
    @Query('venueId') venueId?: string,
    @Query('zoneId') zoneId?: string,
    @Query('status') status?: string,
    @Query('available') available?: boolean,
  ) {
    return this.seatService.findAllSeats({ venueId, zoneId, status, available });
  }

  @Get('zones')
  @ApiOperation({ summary: 'Get all zones with hierarchy' })
  @ApiQuery({ name: 'venueId', required: false, description: 'Filter by venue ID' })
  @ApiQuery({ name: 'mappingId', required: false, description: 'Filter by mapping ID' })
  @ApiQuery({ name: 'parentZoneId', required: false, description: 'Filter by parent zone' })
  async getZones(
    @Query('venueId') venueId?: string,
    @Query('mappingId') mappingId?: string,
    @Query('parentZoneId') parentZoneId?: string,
  ) {
    return this.seatService.getZones({ venueId, mappingId, parentZoneId });
  }

  @Get('zones/:zoneId/hierarchy')
  @ApiOperation({ summary: 'Get zone hierarchy tree' })
  async getZoneHierarchy(@Param('zoneId') zoneId: string) {
    return this.seatService.getZoneHierarchy(zoneId);
  }

  @Get('zones/:zoneId/seats')
  @ApiOperation({ summary: 'Get seats in a zone' })
  @ApiQuery({ name: 'available', required: false, description: 'Filter by availability' })
  async getSeatsInZone(
    @Param('zoneId') zoneId: string,
    @Query('available') available?: boolean,
  ) {
    return this.seatService.getSeatsInZone(zoneId, available);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get seat by ID' })
  @ApiResponse({ status: 200, description: 'Seat found' })
  @ApiResponse({ status: 404, description: 'Seat not found' })
  async findOne(@Param('id') id: string) {
    return this.seatService.findSeatById(id);
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Check seat availability for specific event/date' })
  @ApiQuery({ name: 'eventId', required: false, description: 'Event ID' })
  @ApiQuery({ name: 'date', required: false, description: 'Date' })
  async checkSeatAvailability(
    @Param('id') id: string,
    @Query('eventId') eventId?: string,
    @Query('date') date?: string,
  ) {
    return this.seatService.checkSeatAvailability(id, eventId, date ? new Date(date) : undefined);
  }

  @Get(':id/pricing')
  @ApiOperation({ summary: 'Get seat pricing information' })
  async getSeatPricing(@Param('id') id: string) {
    return this.seatService.getSeatPricing(id);
  }

  @Get(':id/reservations')
  @ApiOperation({ summary: 'Get seat reservations' })
  @ApiQuery({ name: 'from', required: false, description: 'From date' })
  @ApiQuery({ name: 'to', required: false, description: 'To date' })
  async getSeatReservations(
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.seatService.getSeatReservations(id, {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'venue_manager')
  @ApiOperation({ summary: 'Create new seat' })
  @ApiBody({ type: Seat })
  @ApiResponse({ status: 201, description: 'Seat created' })
  async create(@Body() dto: Partial<Seat>, @Request() req: any) {
    return this.seatService.createSeat(dto, req.user.id);
  }

  @Post('zones')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'venue_manager')
  @ApiOperation({ summary: 'Create new zone' })
  async createZone(@Body() zoneData: any, @Request() req: any) {
    return this.seatService.createZone(zoneData, req.user.id);
  }

  @Post(':id/reserve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ticket_manager')
  @ApiOperation({ summary: 'Reserve seat temporarily' })
  async reserveSeat(
    @Param('id') id: string,
    @Body() body: { eventId: string; duration?: number; userId?: string },
    @Request() req: any,
  ) {
    return this.seatService.reserveSeat(id, body, req.user.id);
  }

  @Post(':id/release')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ticket_manager')
  @ApiOperation({ summary: 'Release seat reservation' })
  async releaseSeat(
    @Param('id') id: string,
    @Body() body: { eventId: string; reservationId: string },
    @Request() req: any,
  ) {
    return this.seatService.releaseSeat(id, body, req.user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'venue_manager')
  @ApiOperation({ summary: 'Update seat' })
  async update(@Param('id') id: string, @Body() dto: Partial<Seat>, @Request() req: any) {
    return this.seatService.updateSeat(id, dto, req.user.id);
  }

  @Put('zones/:zoneId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'venue_manager')
  @ApiOperation({ summary: 'Update zone' })
  async updateZone(
    @Param('zoneId') zoneId: string,
    @Body() zoneData: any,
    @Request() req: any,
  ) {
    return this.seatService.updateZone(zoneId, zoneData, req.user.id);
  }

  @Put(':id/pricing')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'venue_manager')
  @ApiOperation({ summary: 'Update seat pricing' })
  async updatePricing(
    @Param('id') id: string,
    @Body() pricingData: any,
    @Request() req: any,
  ) {
    return this.seatService.updateSeatPricing(id, pricingData, req.user.id);
  }

  @Put('zones/:zoneId/pricing')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'venue_manager')
  @ApiOperation({ summary: 'Update zone pricing' })
  async updateZonePricing(
    @Param('zoneId') zoneId: string,
    @Body() pricingData: any,
    @Request() req: any,
  ) {
    return this.seatService.updateZonePricing(zoneId, pricingData, req.user.id);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'venue_manager')
  @ApiOperation({ summary: 'Update seat status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; reason?: string },
    @Request() req: any,
  ) {
    return this.seatService.updateSeatStatus(id, body.status, body.reason, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'venue_manager')
  @ApiOperation({ summary: 'Delete seat' })
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.seatService.removeSeat(id, req.user.id);
    return { message: 'Seat deleted successfully' };
  }

  @Delete('zones/:zoneId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'venue_manager')
  @ApiOperation({ summary: 'Delete zone' })
  async removeZone(@Param('zoneId') zoneId: string, @Request() req: any) {
    await this.seatService.removeZone(zoneId, req.user.id);
    return { message: 'Zone deleted successfully' };
  }

  @Post('bulk-import')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'venue_manager')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Bulk import seats from file' })
  async bulkImport(
    @UploadedFile() file: Express.Multer.File, 
    @Query('format') format: string = 'csv',
    @Request() req: any,
  ) {
    if (!file) throw new Error('No file uploaded');
    let records;
    if (format === 'csv') {
      const csv = file.buffer.toString('utf-8');
      records = csvParse.parse(csv, { columns: true, skip_empty_lines: true, trim: true });
    } else {
      records = JSON.parse(file.buffer.toString('utf-8'));
    }
    // Bulk create/update
    const results = [];
    for (const dto of records) {
      if (dto.id) {
        // Update if exists
        try {
          results.push(await this.seatService.updateSeat(dto.id, dto, req.user.id));
        } catch {
          results.push(await this.seatService.createSeat(dto, req.user.id));
        }
      } else {
        results.push(await this.seatService.createSeat(dto, req.user.id));
      }
    }
    return results;
  }

  @Get('bulk-export')
  @ApiOperation({ summary: 'Bulk export seats' })
  async bulkExport(
    @Query('format') format: string = 'csv', 
    @Res() res: Response,
    @Query('venueId') venueId?: string,
    @Query('zoneId') zoneId?: string,
  ) {
    const seats = await this.seatService.findAllSeats({ venueId, zoneId });
    if (format === 'csv') {
      const parser = new Json2CsvParser();
      const csv = parser.parse(seats);
      res.header('Content-Type', 'text/csv');
      res.attachment('seats_export.csv');
      return res.send(csv);
    } else {
      res.header('Content-Type', 'application/json');
      return res.json(seats);
    }
  }

  @Put('bulk-update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'venue_manager')
  @ApiOperation({ summary: 'Bulk update seats' })
  async bulkUpdate(@Body() updates: Partial<Seat>[], @Request() req: any) {
    const results = [];
    for (const dto of updates) {
      if (dto.id) {
        results.push(await this.seatService.updateSeat(dto.id, dto, req.user.id));
      }
    }
    return results;
  }

  @Delete('bulk-delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'venue_manager')
  @ApiOperation({ summary: 'Bulk delete seats' })
  async bulkDelete(@Body() body: { ids: string[] }, @Request() req: any) {
    for (const id of body.ids) {
      await this.seatService.removeSeat(id, req.user.id);
    }
    return { deleted: body.ids.length };
  }

  @Get('analytics/occupancy')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'analyst')
  @ApiOperation({ summary: 'Get seat occupancy analytics' })
  async getOccupancyAnalytics(
    @Query('venueId') venueId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.seatService.getOccupancyAnalytics(venueId || '', {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('analytics/revenue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'analyst')
  @ApiOperation({ summary: 'Get seat revenue analytics' })
  async getRevenueAnalytics(
    @Query('venueId') venueId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.seatService.getRevenueAnalytics(venueId || '', {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }
} 