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
import { LoginAttemptService } from './login-attempt.service';
import { CreateLoginAttemptDto } from './dto/create-login-attempt.dto';
import { UpdateLoginAttemptDto } from './dto/update-login-attempt.dto';

@ApiTags('Login Attempts')
@Controller('login-attempts')
export class LoginAttemptController {
  constructor(private readonly loginAttemptService: LoginAttemptService) {}

  @Get()
  @ApiOperation({ summary: 'Get all login attempts' })
  @ApiResponse({ status: 200, description: 'List of login attempts' })
  async findAll() {
    return this.loginAttemptService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single login attempt by ID' })
  @ApiResponse({ status: 200, description: 'Login attempt found' })
  @ApiResponse({ status: 404, description: 'Login attempt not found' })
  async findOne(@Param('id') id: string) {
    return this.loginAttemptService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new login attempt' })
  @ApiResponse({ status: 201, description: 'Login attempt created' })
  async create(@Body() createDto: CreateLoginAttemptDto) {
    return this.loginAttemptService.create(createDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a login attempt' })
  @ApiResponse({ status: 200, description: 'Login attempt updated' })
  @ApiResponse({ status: 404, description: 'Login attempt not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateLoginAttemptDto,
  ) {
    return this.loginAttemptService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a login attempt' })
  @ApiResponse({ status: 200, description: 'Login attempt deleted' })
  @ApiResponse({ status: 404, description: 'Login attempt not found' })
  async remove(@Param('id') id: string) {
    await this.loginAttemptService.remove(id);
    return { message: 'Login attempt deleted successfully' };
  }

  @Get('/user/:userId/history')
  @ApiOperation({ summary: 'Get login history for a user' })
  @ApiResponse({ status: 200, description: 'User login history' })
  async getUserLoginHistory(@Param('userId') userId: string) {
    return this.loginAttemptService.getUserLoginHistory(userId);
  }
}
