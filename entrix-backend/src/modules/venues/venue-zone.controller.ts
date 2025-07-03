import { Controller, Get, Post, Put, Delete, Param, Body, Query, Res, UseInterceptors, UploadedFile } from '@nestjs/common';
import { VenueZoneService } from './venue-zone.service';
import { VenueZone } from './venue-zone.entity';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import * as csvParse from 'csv-parse/sync';
// @ts-ignore
import { Parser as Json2CsvParser } from 'json2csv';

@Controller('venue-zones')
export class VenueZoneController {
  constructor(private readonly zoneService: VenueZoneService) {}

  @Get()
  async findAll() {
    return this.zoneService.findAllZones();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.zoneService.findZoneById(id);
  }

  @Post()
  async create(@Body() dto: Partial<VenueZone>) {
    return this.zoneService.createZone(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: Partial<VenueZone>) {
    return this.zoneService.updateZone(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.zoneService.removeZone(id);
    return { message: 'Zone deleted successfully' };
  }

  @Post('bulk-import')
  @UseInterceptors(FileInterceptor('file'))
  async bulkImport(@UploadedFile() file: Express.Multer.File, @Query('format') format: string = 'csv') {
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
          results.push(await this.zoneService.updateZone(dto.id, dto));
        } catch {
          results.push(await this.zoneService.createZone(dto));
        }
      } else {
        results.push(await this.zoneService.createZone(dto));
      }
    }
    return results;
  }

  @Get('bulk-export')
  async bulkExport(@Query('format') format: string = 'csv', @Res() res: Response) {
    const zones = await this.zoneService.findAllZones();
    if (format === 'csv') {
      const parser = new Json2CsvParser();
      const csv = parser.parse(zones);
      res.header('Content-Type', 'text/csv');
      res.attachment('venue_zones_export.csv');
      return res.send(csv);
    } else {
      res.header('Content-Type', 'application/json');
      return res.json(zones);
    }
  }

  @Put('bulk-update')
  async bulkUpdate(@Body() updates: Partial<VenueZone>[]) {
    const results = [];
    for (const dto of updates) {
      if (dto.id) {
        results.push(await this.zoneService.updateZone(dto.id, dto));
      }
    }
    return results;
  }

  @Delete('bulk-delete')
  async bulkDelete(@Body() body: { ids: string[] }) {
    for (const id of body.ids) {
      await this.zoneService.removeZone(id);
    }
    return { deleted: body.ids.length };
  }

  @Get('hierarchy/:venueId')
  async getZoneHierarchy(@Param('venueId') venueId: string) {
    return this.zoneService.getZoneHierarchy(venueId);
  }

  @Post('hierarchy/:venueId')
  async setZoneHierarchy(@Param('venueId') venueId: string, @Body() tree: any[]) {
    return this.zoneService.setZoneHierarchy(venueId, tree);
  }
} 