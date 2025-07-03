import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SecurityEventService } from './security-event.service';
import { CreateSecurityEventDto } from './dto/create-security-event.dto';
import { UpdateSecurityEventDto } from './dto/update-security-event.dto';

@ApiTags('Security Events')
@Controller('security-events')
export class SecurityEventController {
  constructor(private readonly securityEventService: SecurityEventService) {}

  @Get()
  @ApiOperation({ summary: 'Get all security events' })
  @ApiResponse({ status: 200, description: 'List of security events' })
  async findAll() {
    return this.securityEventService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single security event by ID' })
  @ApiResponse({ status: 200, description: 'Security event found' })
  @ApiResponse({ status: 404, description: 'Security event not found' })
  async findOne(@Param('id') id: string) {
    return this.securityEventService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new security event' })
  @ApiResponse({ status: 201, description: 'Security event created' })
  async create(@Body() createDto: CreateSecurityEventDto) {
    return this.securityEventService.create(createDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a security event' })
  @ApiResponse({ status: 200, description: 'Security event updated' })
  @ApiResponse({ status: 404, description: 'Security event not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateSecurityEventDto,
  ) {
    return this.securityEventService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a security event' })
  @ApiResponse({ status: 200, description: 'Security event deleted' })
  @ApiResponse({ status: 404, description: 'Security event not found' })
  async remove(@Param('id') id: string) {
    await this.securityEventService.remove(id);
    return { message: 'Security event deleted successfully' };
  }
}
