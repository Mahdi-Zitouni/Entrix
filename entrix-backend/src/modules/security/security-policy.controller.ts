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
import { SecurityPolicyService } from './security-policy.service';
import { CreateSecurityPolicyDto } from './dto/create-security-policy.dto';
import { UpdateSecurityPolicyDto } from './dto/update-security-policy.dto';

@ApiTags('Security Policies')
@Controller('security-policies')
export class SecurityPolicyController {
  constructor(private readonly securityPolicyService: SecurityPolicyService) {}

  @Get()
  @ApiOperation({ summary: 'Get all security policies' })
  @ApiResponse({ status: 200, description: 'List of security policies' })
  async findAll() {
    return this.securityPolicyService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single security policy by ID' })
  @ApiResponse({ status: 200, description: 'Security policy found' })
  @ApiResponse({ status: 404, description: 'Security policy not found' })
  async findOne(@Param('id') id: string) {
    return this.securityPolicyService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new security policy' })
  @ApiResponse({ status: 201, description: 'Security policy created' })
  async create(@Body() createDto: CreateSecurityPolicyDto) {
    return this.securityPolicyService.create(createDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a security policy' })
  @ApiResponse({ status: 200, description: 'Security policy updated' })
  @ApiResponse({ status: 404, description: 'Security policy not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateSecurityPolicyDto,
  ) {
    return this.securityPolicyService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a security policy' })
  @ApiResponse({ status: 200, description: 'Security policy deleted' })
  @ApiResponse({ status: 404, description: 'Security policy not found' })
  async remove(@Param('id') id: string) {
    await this.securityPolicyService.remove(id);
    return { message: 'Security policy deleted successfully' };
  }
}
