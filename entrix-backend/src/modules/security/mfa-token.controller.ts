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
import { MfaTokenService } from './mfa-token.service';
import { CreateMfaTokenDto } from './dto/create-mfa-token.dto';
import { UpdateMfaTokenDto } from './dto/update-mfa-token.dto';

@ApiTags('MFA Tokens')
@Controller('mfa-tokens')
export class MfaTokenController {
  constructor(private readonly mfaTokenService: MfaTokenService) {}

  @Get()
  @ApiOperation({ summary: 'Get all MFA tokens' })
  @ApiResponse({ status: 200, description: 'List of MFA tokens' })
  async findAll() {
    return this.mfaTokenService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single MFA token by ID' })
  @ApiResponse({ status: 200, description: 'MFA token found' })
  @ApiResponse({ status: 404, description: 'MFA token not found' })
  async findOne(@Param('id') id: string) {
    return this.mfaTokenService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new MFA token' })
  @ApiResponse({ status: 201, description: 'MFA token created' })
  async create(@Body() createDto: CreateMfaTokenDto) {
    return this.mfaTokenService.create(createDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an MFA token' })
  @ApiResponse({ status: 200, description: 'MFA token updated' })
  @ApiResponse({ status: 404, description: 'MFA token not found' })
  async update(@Param('id') id: string, @Body() updateDto: UpdateMfaTokenDto) {
    return this.mfaTokenService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an MFA token' })
  @ApiResponse({ status: 200, description: 'MFA token deleted' })
  @ApiResponse({ status: 404, description: 'MFA token not found' })
  async remove(@Param('id') id: string) {
    await this.mfaTokenService.remove(id);
    return { message: 'MFA token deleted successfully' };
  }
}
