import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserSessionService } from './user-session.service';
import { CreateUserSessionDto } from './dto/create-user-session.dto';
import { UpdateUserSessionDto } from './dto/update-user-session.dto';

@ApiTags('User Sessions')
@Controller('user-sessions')
export class UserSessionController {
  constructor(private readonly userSessionService: UserSessionService) {}

  @Get()
  @ApiOperation({ summary: 'Get all user sessions' })
  @ApiResponse({ status: 200, description: 'List of user sessions' })
  async findAll() {
    return this.userSessionService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single user session by ID' })
  @ApiResponse({ status: 200, description: 'User session found' })
  @ApiResponse({ status: 404, description: 'User session not found' })
  async findOne(@Param('id') id: string) {
    return this.userSessionService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user session' })
  @ApiResponse({ status: 201, description: 'User session created' })
  async create(@Body() createDto: CreateUserSessionDto) {
    return this.userSessionService.create(createDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a user session' })
  @ApiResponse({ status: 200, description: 'User session updated' })
  @ApiResponse({ status: 404, description: 'User session not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateUserSessionDto,
  ) {
    return this.userSessionService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user session' })
  @ApiResponse({ status: 200, description: 'User session deleted' })
  @ApiResponse({ status: 404, description: 'User session not found' })
  async remove(@Param('id') id: string) {
    await this.userSessionService.remove(id);
    return { message: 'User session deleted successfully' };
  }

  @Get('search')
  async search(
    @Query('userId') userId?: string,
    @Query('isActive') isActive?: string,
    @Query('ipAddress') ipAddress?: string,
    @Query('deviceFingerprint') deviceFingerprint?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.userSessionService.findByQuery({
      userId,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      ipAddress,
      deviceFingerprint,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }
}
