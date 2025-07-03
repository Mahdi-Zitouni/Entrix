import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  Put, 
  Delete,
  Query,
  UseGuards,
  Request,
  Patch,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  NotificationService,
  NotificationPayload,
} from './notification.service';
import { ApiOperation, ApiTags, ApiQuery, ApiResponse, ApiBody } from '@nestjs/swagger';
import { NotificationPreferenceService } from './notification-preference.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { FileInterceptor } from '@nestjs/platform-express';

class NotificationPayloadDto {
  channel: 'email' | 'sms' | 'in-app' | 'webhook';
  recipient: string;
  template: string;
  data: Record<string, unknown>;
}

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly notificationPreferenceService: NotificationPreferenceService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'notification_manager')
  @ApiOperation({ summary: 'Get all notifications with optional filtering' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by notification type' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'from', required: false, description: 'Filter from date' })
  @ApiQuery({ name: 'to', required: false, description: 'Filter to date' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  async findAll(
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.notificationService.findAll({
      type,
      status,
      userId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      page: page || 1,
      limit: limit || 20,
    });
  }

  @Get('my-notifications')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user notifications' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by type' })
  @ApiQuery({ name: 'read', required: false, description: 'Filter by read status' })
  @ApiQuery({ name: 'from', required: false, description: 'From date' })
  @ApiQuery({ name: 'to', required: false, description: 'To date' })
  async getMyNotifications(
    @Request() req: any,
    @Query('type') type?: string,
    @Query('read') read?: boolean,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.notificationService.getUserNotifications(req.user.id, {
      type,
      read,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get unread notification count for current user' })
  async getUnreadCount(@Request() req: any) {
    return this.notificationService.getUnreadCount(req.user.id);
  }

  @Get('analytics/overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Get notification analytics overview' })
  @ApiQuery({ name: 'from', required: false, description: 'From date' })
  @ApiQuery({ name: 'to', required: false, description: 'To date' })
  async getAnalyticsOverview(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.notificationService.getAnalyticsOverview({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('analytics/delivery')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Get notification delivery analytics' })
  async getDeliveryAnalytics(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.notificationService.getDeliveryAnalytics({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('analytics/engagement')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Get notification engagement analytics' })
  async getEngagementAnalytics(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.notificationService.getEngagementAnalytics({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Post('send')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'notification_manager')
  @ApiOperation({ summary: 'Send a notification (multi-channel)' })
  @ApiBody({ type: NotificationPayloadDto })
  @ApiResponse({ status: 201, description: 'Notification sent' })
  async sendNotification(
    @Body() payload: NotificationPayloadDto,
    @Request() req: any,
  ) {
    return this.notificationService.sendNotification(payload as NotificationPayload, req.user.id);
  }

  @Post('send-bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'notification_manager')
  @ApiOperation({ summary: 'Send bulk notifications' })
  async sendBulkNotifications(
    @Body() body: { payloads: NotificationPayloadDto[] },
    @Request() req: any,
  ) {
    return this.notificationService.sendBulkNotifications(
      body.payloads as NotificationPayload[],
      req.user.id,
    );
  }

  @Post('schedule')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'notification_manager')
  @ApiOperation({ summary: 'Schedule a notification' })
  async scheduleNotification(
    @Body() body: {
      payload: NotificationPayloadDto;
      scheduledAt: string;
    },
    @Request() req: any,
  ) {
    return this.notificationService.scheduleNotification(
      body.payload as NotificationPayload,
      new Date(body.scheduledAt),
      req.user.id,
    );
  }

  @Post('mass-send')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'notification_manager')
  @ApiOperation({ summary: 'Send mass notifications to filtered users' })
  async massSend(
    @Body() body: {
      filters?: any;
      channel: string;
      subject?: string;
      message?: string;
      template?: string;
      data?: Record<string, any>;
    },
    @Request() req: any,
  ) {
    // Find users matching filters
    const users = await this.usersService.findByQuery(body.filters || {});
    const results = [];
    for (const user of users) {
      const payload = {
        channel: body.channel as any,
        recipient: user.email, // or user.phone for SMS, etc.
        template: body.template || 'custom',
        data: {
          subject: body.subject,
          message: body.message,
          ...body.data,
          user,
        },
      };
      const result = await this.notificationService.sendNotification(payload, req.user.id);
      results.push({ userId: user.id, email: user.email, result });
    }
    return { total: users.length, results };
  }

  @Get('templates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'notification_manager')
  @ApiOperation({ summary: 'List notification templates' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by template type' })
  @ApiQuery({ name: 'channel', required: false, description: 'Filter by channel' })
  async getTemplates(
    @Query('type') type?: string,
    @Query('channel') channel?: string,
  ) {
    return this.notificationService.getTemplates({
      type,
      channel: channel as any,
    });
  }

  @Get('templates/:name')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'notification_manager')
  @ApiOperation({ summary: 'Get a notification template by name' })
  @ApiResponse({ status: 200, description: 'Template found' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async getTemplate(@Param('name') name: string) {
    return this.notificationService.getTemplate(name);
  }

  @Post('templates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'notification_manager')
  @ApiOperation({ summary: 'Create a new notification template' })
  async createTemplate(
    @Body() body: {
      name: string;
      type: string;
      channel: string;
      subject?: string;
      content: string;
      variables?: string[];
    },
    @Request() req: any,
  ) {
    return this.notificationService.createTemplate({
      ...body,
      channel: body.channel as any,
    }, req.user.id);
  }

  @Put('templates/:name')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'notification_manager')
  @ApiOperation({ summary: 'Update a notification template' })
  async updateTemplate(
    @Param('name') name: string,
    @Body() body: {
      content: string;
      subject?: string;
      variables?: string[];
    },
    @Request() req: any,
  ) {
    return this.notificationService.updateTemplate(name, body.content, req.user.id);
  }

  @Delete('templates/:name')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a notification template' })
  async deleteTemplate(@Param('name') name: string, @Request() req: any) {
    return this.notificationService.deleteTemplate(name, req.user.id);
  }

  @Post('templates/import')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'notification_manager')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Import notification templates from file' })
  async importTemplates(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    return this.notificationService.importTemplates(file, req.user.id);
  }

  @Get('templates/export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'notification_manager')
  @ApiOperation({ summary: 'Export notification templates' })
  async exportTemplates(
    @Query('type') type?: string,
    @Query('channel') channel?: string,
  ) {
    return this.notificationService.exportTemplates({ type, channel: channel as any });
  }

  @Get('preferences/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'notification_manager')
  @ApiOperation({ summary: 'Get user notification preferences' })
  async getPreferences(@Param('userId') userId: string) {
    return this.notificationPreferenceService.getByUserId(userId);
  }

  @Get('preferences')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user notification preferences' })
  async getMyPreferences(@Request() req: any) {
    return this.notificationPreferenceService.getByUserId(req.user.id);
  }

  @Post('preferences/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'notification_manager')
  @ApiOperation({ summary: 'Set user notification preferences' })
  async setPreferences(
    @Param('userId') userId: string,
    @Body() body: { 
      channels: string[]; 
      optOutTypes?: string[];
      emailFrequency?: string;
      smsEnabled?: boolean;
      pushEnabled?: boolean;
    },
    @Request() req: any,
  ) {
    return this.notificationPreferenceService.setPreferences(
      userId,
      body.channels,
      body.optOutTypes || [],
    );
  }

  @Post('preferences')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Set current user notification preferences' })
  async setMyPreferences(
    @Body() body: { 
      channels: string[]; 
      optOutTypes?: string[];
      emailFrequency?: string;
      smsEnabled?: boolean;
      pushEnabled?: boolean;
    },
    @Request() req: any,
  ) {
    return this.notificationPreferenceService.setPreferences(
      req.user.id,
      body.channels,
      body.optOutTypes || [],
    );
  }

  @Patch('preferences/:userId/opt-out')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'notification_manager')
  @ApiOperation({ summary: 'Opt out user from specific notification types' })
  async optOutUser(
    @Param('userId') userId: string,
    @Body() body: { types: string[]; reason?: string },
    @Request() req: any,
  ) {
    return this.notificationPreferenceService.optOutUser(
      userId,
      undefined,
      body.types[0],
    );
  }

  @Patch('preferences/opt-out')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Opt out current user from specific notification types' })
  async optOutMyself(
    @Body() body: { types: string[]; reason?: string },
    @Request() req: any,
  ) {
    return this.notificationPreferenceService.optOutUser(
      req.user.id,
      undefined,
      body.types[0],
    );
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    return this.notificationService.markAsRead(id, req.user.id);
  }

  @Patch('read-all')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mark all notifications as read for current user' })
  async markAllAsRead(@Request() req: any) {
    return this.notificationService.markAllAsRead(req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a notification' })
  async deleteNotification(@Param('id') id: string, @Request() req: any) {
    return this.notificationService.deleteNotification(id, req.user.id);
  }

  @Delete('clear-all')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Clear all notifications for current user' })
  async clearAllNotifications(@Request() req: any) {
    return this.notificationService.clearAllNotifications(req.user.id);
  }

  @Get('channels')
  @ApiOperation({ summary: 'Get available notification channels' })
  async getAvailableChannels() {
    return this.notificationService.getAvailableChannels();
  }

  @Get('channels/:channel/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'notification_manager')
  @ApiOperation({ summary: 'Get notification channel status' })
  async getChannelStatus(@Param('channel') channel: string) {
    return this.notificationService.getChannelStatus(channel as any);
  }

  @Post('channels/:channel/test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'notification_manager')
  @ApiOperation({ summary: 'Test notification channel' })
  async testChannel(
    @Param('channel') channel: string,
    @Body() body: { recipient: string; message: string },
    @Request() req: any,
  ) {
    return this.notificationService.testChannel(channel as any, body.recipient, body.message, req.user.id);
  }

  @Get('scheduled')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'notification_manager')
  @ApiOperation({ summary: 'Get scheduled notifications' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'from', required: false, description: 'From date' })
  @ApiQuery({ name: 'to', required: false, description: 'To date' })
  async getScheduledNotifications(
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.notificationService.getScheduledNotifications({
      status,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Patch('scheduled/:id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'notification_manager')
  @ApiOperation({ summary: 'Cancel scheduled notification' })
  async cancelScheduledNotification(@Param('id') id: string, @Request() req: any) {
    return this.notificationService.cancelScheduledNotification(id, req.user.id);
  }

  @Patch('scheduled/:id/reschedule')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'notification_manager')
  @ApiOperation({ summary: 'Reschedule notification' })
  async rescheduleNotification(
    @Param('id') id: string,
    @Body() body: { scheduledAt: string; timezone?: string },
    @Request() req: any,
  ) {
    return this.notificationService.rescheduleNotification(
      id,
      new Date(body.scheduledAt),
      req.user.id,
    );
  }

  @Get('reports/delivery')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Generate notification delivery report' })
  async generateDeliveryReport(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('channel') channel?: string,
  ) {
    return this.notificationService.generateDeliveryReport({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      channel: channel as any,
    });
  }

  @Get('reports/engagement')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Generate notification engagement report' })
  async generateEngagementReport(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('type') type?: string,
  ) {
    return this.notificationService.generateEngagementReport({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }
}
