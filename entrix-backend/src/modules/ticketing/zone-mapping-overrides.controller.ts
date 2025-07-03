import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { ZoneMappingOverridesService } from './zone-mapping-overrides.service';
import { CreateZoneMappingOverridesDto } from './dto/create-zone-mapping-overrides.dto';

@Controller('zone-mapping-overrides')
export class ZoneMappingOverridesController {
  constructor(
    private readonly zoneMappingOverridesService: ZoneMappingOverridesService,
  ) {}

  @Post()
  create(@Body() dto: CreateZoneMappingOverridesDto) {
    return this.zoneMappingOverridesService.create(dto);
  }

  @Get()
  findAll() {
    return this.zoneMappingOverridesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.zoneMappingOverridesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateZoneMappingOverridesDto>,
  ) {
    return this.zoneMappingOverridesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.zoneMappingOverridesService.remove(id);
  }
}
