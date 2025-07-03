import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ZoneMappingOverrideService } from './zone-mapping-override.service';
import { ZoneMappingOverride } from './zone-mapping-override.entity';

@ApiTags('ZoneMappingOverride')
@Controller('zone-mapping-override')
export class ZoneMappingOverrideController {
  constructor(private readonly service: ZoneMappingOverrideService) {}

  @Post()
  @ApiOperation({ summary: 'Create a zone mapping override' })
  create(@Body() dto: Partial<ZoneMappingOverride>) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all zone mapping overrides' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a zone mapping override by ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a zone mapping override' })
  update(@Param('id') id: string, @Body() dto: Partial<ZoneMappingOverride>) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a zone mapping override' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate a zone mapping override' })
  activate(@Param('id') id: string) {
    return this.service.activate(id);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a zone mapping override' })
  deactivate(@Param('id') id: string) {
    return this.service.deactivate(id);
  }

  @Get('/active')
  @ApiOperation({ summary: 'Get active override for event/venue/zone/seat' })
  getActiveOverride(
    @Query('eventId') eventId?: string,
    @Query('venueId') venueId?: string,
    @Query('zoneId') zoneId?: string,
    @Query('seatId') seatId?: string,
    @Query('date') date?: string,
  ) {
    return this.service.getActiveOverride({
      eventId,
      venueId,
      zoneId,
      seatId,
      date: date ? new Date(date) : undefined,
    });
  }
}
