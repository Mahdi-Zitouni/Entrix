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
import { BlacklistService } from './blacklist.service';
import { CreateBlacklistDto } from './dto/create-blacklist.dto';
import { BlacklistScope } from './blacklist.entity';

@ApiTags('Blacklist')
@Controller('blacklist')
export class BlacklistController {
  constructor(private readonly blacklistService: BlacklistService) {}

  @Post()
  @ApiOperation({ summary: 'Create blacklist entry' })
  create(@Body() dto: CreateBlacklistDto) {
    return this.blacklistService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all blacklist entries' })
  findAll() {
    return this.blacklistService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a blacklist entry by ID' })
  findOne(@Param('id') id: string) {
    return this.blacklistService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a blacklist entry' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateBlacklistDto>) {
    return this.blacklistService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a blacklist entry' })
  remove(@Param('id') id: string) {
    return this.blacklistService.remove(id);
  }

  @Patch(':id/resolve')
  @ApiOperation({ summary: 'Resolve (deactivate) a blacklist entry' })
  resolve(@Param('id') id: string, @Body('notes') notes?: string) {
    return this.blacklistService.resolve(id, notes);
  }

  @Patch(':id/appeal')
  @ApiOperation({ summary: 'Appeal a blacklist entry' })
  appeal(
    @Param('id') id: string,
    @Body() body: { userId: string; reason: string },
  ) {
    return this.blacklistService.appeal(id, body.userId, body.reason);
  }

  @Patch(':id/evidence')
  @ApiOperation({ summary: 'Add evidence to a blacklist entry' })
  addEvidence(
    @Param('id') id: string,
    @Body('evidence') evidence: Record<string, unknown>,
  ) {
    return this.blacklistService.addEvidence(id, evidence);
  }

  @Get('/is-blacklisted')
  @ApiOperation({ summary: 'Check if a user or identifier is blacklisted' })
  isBlacklisted(
    @Query('userId') userId?: string,
    @Query('identifier') identifier?: string,
    @Query('eventId') eventId?: string,
    @Query('scope') scope?: BlacklistScope,
  ) {
    return this.blacklistService.isBlacklisted({
      userId,
      identifier,
      eventId,
      scope,
    });
  }
}
