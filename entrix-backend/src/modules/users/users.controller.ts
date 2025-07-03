import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Res,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { MembershipStatus } from './user-role.entity';
import { ApiOperation, ApiTags, ApiQuery, ApiResponse, ApiBody } from '@nestjs/swagger';
// @ts-ignore
import { Parser as Json2CsvParser } from 'json2csv';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import * as csvParse from 'csv-parse/sync';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'user_manager')
  @ApiOperation({ summary: 'Get all users with optional filtering' })
  @ApiQuery({ name: 'role', required: false, description: 'Filter by role' })
  @ApiQuery({ name: 'group', required: false, description: 'Filter by group' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'from', required: false, description: 'Filter from date' })
  @ApiQuery({ name: 'to', required: false, description: 'Filter to date' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  async findAll(
    @Request() req: any,
    @Query('role') role?: string,
    @Query('group') group?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    console.log('🚦 HIT /users endpoint (findAll)');
    console.log(
      '🔍 DEBUG - User object in findAll:',
      JSON.stringify(req?.user, null, 2),
    );
    console.log('🔍 DEBUG - User roles:', req?.user?.roles);
    console.log('🔍 DEBUG - Required roles: ["ADMIN", "user_manager"]');
    
    return this.usersService.findAll({
      role,
      group,
      status,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      page: page || 1,
      limit: limit || 20,
    });
  }

  @Get('search')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'user_manager')
  @ApiOperation({ summary: 'Advanced user search/segmentation' })
  @ApiQuery({ name: 'email', required: false, description: 'Search by email' })
  @ApiQuery({ name: 'name', required: false, description: 'Search by name' })
  @ApiQuery({ name: 'role', required: false, description: 'Filter by role' })
  @ApiQuery({ name: 'group', required: false, description: 'Filter by group' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'from', required: false, description: 'Filter from date' })
  @ApiQuery({ name: 'to', required: false, description: 'Filter to date' })
  async findByQuery(
    @Query('email') email?: string,
    @Query('name') name?: string,
    @Query('role') role?: string,
    @Query('group') group?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.usersService.findByQuery({
      email,
      name,
      role,
      group,
      status,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  async getCurrentUser(@Request() req: any) {
    return this.usersService.getCurrentUser(req.user.id);
  }

  @Get('me/profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user detailed profile' })
  async getCurrentUserProfile(@Request() req: any) {
    return this.usersService.getCurrentUserProfile(req.user.id);
  }

  @Get('me/activity')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user activity' })
  @ApiQuery({ name: 'from', required: false, description: 'From date' })
  @ApiQuery({ name: 'to', required: false, description: 'To date' })
  @ApiQuery({ name: 'type', required: false, description: 'Activity type' })
  async getCurrentUserActivity(
    @Request() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('type') type?: string,
  ) {
    return this.usersService.getCurrentUserActivity(req.user.id, {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      type,
    });
  }

  @Get('me/preferences')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user preferences' })
  async getCurrentUserPreferences(@Request() req: any) {
    return this.usersService.getCurrentUserPreferences(req.user.id);
  }

  @Get('me/tickets')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user tickets' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by ticket status' })
  @ApiQuery({ name: 'from', required: false, description: 'From date' })
  @ApiQuery({ name: 'to', required: false, description: 'To date' })
  async getCurrentUserTickets(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.usersService.getCurrentUserTickets(req.user.id, {
      status,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('me/events')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user events' })
  @ApiQuery({ name: 'type', required: false, description: 'Event type (attended, registered, etc.)' })
  async getCurrentUserEvents(
    @Request() req: any,
    @Query('type') type?: string,
  ) {
    return this.usersService.getCurrentUserEvents(req.user.id, type);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'user_manager')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get(':id/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'user_manager')
  @ApiOperation({ summary: 'Get user detailed profile' })
  async getUserProfile(@Param('id') id: string) {
    return this.usersService.getUserProfile(id);
  }

  @Get(':id/activity')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'user_manager')
  @ApiOperation({ summary: 'Get user activity' })
  @ApiQuery({ name: 'from', required: false, description: 'From date' })
  @ApiQuery({ name: 'to', required: false, description: 'To date' })
  @ApiQuery({ name: 'type', required: false, description: 'Activity type' })
  async getUserActivity(
    @Param('id') id: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('type') type?: string,
  ) {
    return this.usersService.getUserActivity(id, {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      type,
    });
  }

  @Get(':id/tickets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'user_manager')
  @ApiOperation({ summary: 'Get user tickets' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by ticket status' })
  async getUserTickets(
    @Param('id') id: string,
    @Query('status') status?: string,
  ) {
    return this.usersService.getUserTickets(id, status);
  }

  @Get(':id/export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Export user data (GDPR)' })
  async exportUserData(
    @Res() res: Response,
    @Param('id') id: string,
    @Query('format') format: string = 'json',
  ) {
    const data = await this.usersService.exportUserData(id);

    if (format === 'csv') {
      // Flatten and convert each section to CSV
      const csvSections = [];
      for (const [section, value] of Object.entries(data)) {
        if (Array.isArray(value)) {
          if (value.length > 0) {
            const parser = new Json2CsvParser();
            csvSections.push(`\n\n### ${section} ###\n` + parser.parse(value));
          }
        } else if (typeof value === 'object' && value !== null) {
          const parser = new Json2CsvParser();
          csvSections.push(`\n\n### ${section} ###\n` + parser.parse([value]));
        }
      }
      const csv = csvSections.join('\n');
      res.header('Content-Type', 'text/csv');
      res.attachment(`user_${id}_export.csv`);
      return res.send(csv);
    } else {
      res.header('Content-Type', 'application/json');
      return res.json(data);
    }
  }

  @Delete(':id/gdpr-delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete user data (GDPR)' })
  async deleteUserData(@Param('id') id: string) {
    return this.usersService.deleteUserData(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'user_manager')
  @ApiOperation({ summary: 'Create new user' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created' })
  async create(@Body() createUserDto: CreateUserDto, @Request() req: any) {
    return this.usersService.create(createUserDto, req.user.id);
  }

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: 'Upload current user avatar' })
  async uploadAvatar(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.usersService.uploadAvatar(req.user.id, file);
  }

  @Post(':id/avatar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'user_manager')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiOperation({ summary: 'Upload user avatar' })
  async uploadUserAvatar(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.usersService.uploadAvatar(id, file);
  }

  @Post(':id/verify-email')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'user_manager')
  @ApiOperation({ summary: 'Manually verify user email' })
  async verifyUserEmail(@Param('id') id: string, @Request() req: any) {
    return this.usersService.verifyUserEmail(id, req.user.id);
  }

  @Post(':id/verify-phone')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'user_manager')
  @ApiOperation({ summary: 'Manually verify user phone' })
  async verifyUserPhone(@Param('id') id: string, @Request() req: any) {
    return this.usersService.verifyUserPhone(id, req.user.id);
  }

  @Post(':id/send-verification-email')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'user_manager')
  @ApiOperation({ summary: 'Send verification email to user' })
  async sendVerificationEmail(@Param('id') id: string, @Request() req: any) {
    return this.usersService.sendVerificationEmail(id, req.user.id);
  }

  @Post(':id/send-verification-sms')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'user_manager')
  @ApiOperation({ summary: 'Send verification SMS to user' })
  async sendVerificationSms(@Param('id') id: string, @Request() req: any) {
    return this.usersService.sendVerificationSms(id, req.user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'user_manager')
  @ApiOperation({ summary: 'Update user' })
  @ApiBody({ type: UpdateUserDto })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Request() req: any) {
    return this.usersService.update(id, updateUserDto, req.user.id);
  }

  @Put('me/profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update current user profile' })
  async updateCurrentUserProfile(
    @Request() req: any,
    @Body() profileData: any,
  ) {
    return this.usersService.updateCurrentUserProfile(req.user.id, profileData);
  }

  @Put('me/preferences')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update current user preferences' })
  async updateCurrentUserPreferences(
    @Request() req: any,
    @Body() preferences: any,
  ) {
    return this.usersService.updateCurrentUserPreferences(req.user.id, preferences);
  }

  @Put(':id/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'user_manager')
  @ApiOperation({ summary: 'Update user profile' })
  async updateUserProfile(
    @Param('id') id: string,
    @Body() profileData: any,
    @Request() req: any,
  ) {
    return this.usersService.updateUserProfile(id, profileData, req.user.id);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'user_manager')
  @ApiOperation({ summary: 'Update user status' })
  async updateUserStatus(
    @Param('id') id: string,
    @Body() body: { isActive: boolean; reason?: string },
    @Request() req: any,
  ) {
    return this.usersService.updateUserStatus(id, body.isActive, body.reason, req.user.id);
  }

  @Post(':id/roles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Assign role to user' })
  async assignRole(
    @Param('id') id: string,
    @Body() body: { roleId: string; status?: MembershipStatus },
    @Request() req: any,
  ) {
    return this.usersService.assignRole(id, body.roleId, body.status, req.user.id);
  }

  @Delete(':id/roles/:roleId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Remove role from user' })
  async removeRole(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
    @Request() req: any,
  ) {
    await this.usersService.removeRole(id, roleId, req.user.id);
    return { message: 'Role removed from user' };
  }

  @Post(':id/groups')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Assign group to user' })
  async assignGroup(
    @Param('id') id: string,
    @Body() body: { groupId: string; status?: MembershipStatus },
    @Request() req: any,
  ) {
    return this.usersService.assignGroup(id, body.groupId, body.status, req.user.id);
  }

  @Delete(':id/groups/:groupId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Remove group from user' })
  async removeGroup(
    @Param('id') id: string,
    @Param('groupId') groupId: string,
    @Request() req: any,
  ) {
    await this.usersService.removeGroup(id, groupId, req.user.id);
    return { message: 'Group removed from user' };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete user' })
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.usersService.remove(id, req.user.id);
    return { message: 'User deleted successfully' };
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'user_manager')
  @ApiOperation({ summary: 'Bulk create users' })
  async bulkCreate(@Body() createUserDtos: CreateUserDto[], @Request() req: any) {
    return this.usersService.bulkCreate(createUserDtos, req.user.id);
  }

  @Get('bulk-export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'user_manager')
  @ApiOperation({ summary: 'Bulk export users' })
  async bulkExport(
    @Res() res: Response,
    @Query('email') email?: string,
    @Query('name') name?: string,
    @Query('role') role?: string,
    @Query('group') group?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const users = await this.usersService.findByQuery({
      email,
      name,
      role,
      group,
      status,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
    // Flatten for CSV
    const data = users.map(u => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      phone: u.phone,
      isActive: u.isActive,
      createdAt: u.createdAt,
      lastLogin: u.lastLogin,
    }));
    const parser = new Json2CsvParser();
    const csv = parser.parse(data);
    res.header('Content-Type', 'text/csv');
    res.attachment('users_export.csv');
    return res.send(csv);
  }

  @Post('bulk-import')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'user_manager')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Bulk import users from file' })
  async bulkImport(@UploadedFile() file: Express.Multer.File, @Request() req: any) {
    if (!file) throw new Error('No file uploaded');
    const csv = file.buffer.toString('utf-8');
    const records = csvParse.parse(csv, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    return this.usersService.bulkImport(records, req.user.id);
  }

  @Get(':id/roles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'user_manager')
  @ApiOperation({ summary: 'Get user roles' })
  async getUserRoles(@Param('id') id: string) {
    return this.usersService.getUserRoles(id);
  }

  @Get(':id/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'user_manager')
  @ApiOperation({ summary: 'Get user profile' })
  async getProfile(@Param('id') id: string) {
    return this.usersService.getProfile(id);
  }

  @Put(':id/profile')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'user_manager')
  @ApiOperation({ summary: 'Update user profile' })
  async updateProfile(@Param('id') id: string, @Body() update: Partial<any>, @Request() req: any) {
    return this.usersService.updateProfile(id, update, req.user.id);
  }

  @Get(':id/audit-logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'user_manager')
  @ApiOperation({ summary: 'Get user audit logs' })
  async getAuditLogs(@Param('id') id: string) {
    return this.usersService.getAuditLogs(id);
  }

  @Get('analytics/overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'analyst')
  @ApiOperation({ summary: 'Get users analytics overview' })
  async getAnalyticsOverview(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.usersService.getAnalyticsOverview({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('analytics/registration')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'analyst')
  @ApiOperation({ summary: 'Get user registration analytics' })
  async getRegistrationAnalytics(
    @Query('period') period: string = 'month',
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.usersService.getRegistrationAnalytics(period, {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('analytics/activity')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'analyst')
  @ApiOperation({ summary: 'Get user activity analytics' })
  async getActivityAnalytics(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.usersService.getActivityAnalytics({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }
}
