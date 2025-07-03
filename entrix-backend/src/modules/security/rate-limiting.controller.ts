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
import { RateLimitingService } from './rate-limiting.service';
import { CreateRateLimitingDto } from './dto/create-rate-limiting.dto';
import { UpdateRateLimitingDto } from './dto/update-rate-limiting.dto';

@ApiTags('Rate Limiting')
@Controller('rate-limiting')
export class RateLimitingController {
  constructor(private readonly rateLimitingService: RateLimitingService) {}

  @Get()
  @ApiOperation({ summary: 'Get all rate limiting entries' })
  @ApiResponse({ status: 200, description: 'List of rate limiting entries' })
  async findAll() {
    return this.rateLimitingService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single rate limiting entry by ID' })
  @ApiResponse({ status: 200, description: 'Rate limiting entry found' })
  @ApiResponse({ status: 404, description: 'Rate limiting entry not found' })
  async findOne(@Param('id') id: string) {
    return this.rateLimitingService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new rate limiting entry' })
  @ApiResponse({ status: 201, description: 'Rate limiting entry created' })
  async create(@Body() createDto: CreateRateLimitingDto) {
    return this.rateLimitingService.create(createDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a rate limiting entry' })
  @ApiResponse({ status: 200, description: 'Rate limiting entry updated' })
  @ApiResponse({ status: 404, description: 'Rate limiting entry not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateRateLimitingDto,
  ) {
    return this.rateLimitingService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a rate limiting entry' })
  @ApiResponse({ status: 200, description: 'Rate limiting entry deleted' })
  @ApiResponse({ status: 404, description: 'Rate limiting entry not found' })
  async remove(@Param('id') id: string) {
    await this.rateLimitingService.remove(id);
    return { message: 'Rate limiting entry deleted successfully' };
  }
}
