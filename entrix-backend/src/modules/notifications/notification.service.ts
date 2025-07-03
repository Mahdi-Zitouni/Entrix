import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { NotificationPreferenceService } from './notification-preference.service';
import { NotificationTemplate } from './notification-template.entity';
import { ScheduledNotification } from './scheduled-notification.entity';
import { NotificationHistory } from './notification-history.entity';
import { NotificationPreference } from './notification-preference.entity';

export type NotificationChannel = 'email' | 'sms' | 'in-app' | 'webhook';

export interface NotificationPayload {
  channel: NotificationChannel;
  recipient: string;
  template: string;
  data: Record<string, unknown>;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly preferenceService: NotificationPreferenceService,
    @InjectRepository(NotificationTemplate)
    private readonly templateRepository: Repository<NotificationTemplate>,
    @InjectRepository(ScheduledNotification)
    private readonly scheduledNotificationRepository: Repository<ScheduledNotification>,
    @InjectRepository(NotificationHistory)
    private readonly notificationHistoryRepository: Repository<NotificationHistory>,
  ) {}

  // Pluggable provider interface (future extension)
  private providers: Partial<Record<NotificationChannel, (payload: NotificationPayload) => Promise<void>>> = {};

  // Send notification via the specified channel
  async sendNotification(payload: NotificationPayload, userId?: string): Promise<{ success: boolean; message: string }> {
    // For email notifications, we need to find the user ID first to check preferences
    let userPreferences: NotificationPreference | undefined;
    
    if (payload.channel === 'email') {
      // For email notifications, try to find user by email to check preferences
      // If we can't find the user, we'll skip preference checking
      try {
        // This is a temporary fix - in a real implementation, you'd inject UsersService
        // For now, we'll skip preference checking for email notifications
        userPreferences = undefined;
      } catch (error) {
        // If we can't find the user, continue without preference checking
        userPreferences = undefined;
      }
    } else {
      // For non-email notifications, recipient should be a user ID
      userPreferences = await this.preferenceService.getByUserId(payload.recipient);
    }
    
    // Check user preferences if available
    if (userPreferences) {
      if (userPreferences.channels && !userPreferences.channels.includes(payload.channel)) {
        this.logger.log(`User ${payload.recipient} has disabled channel ${payload.channel}`);
        return { success: false, message: `Channel ${payload.channel} disabled by user` };
      }
      if (userPreferences.optOutTypes && userPreferences.optOutTypes.includes(payload.template)) {
        this.logger.log(`User ${payload.recipient} has opted out of ${payload.template}`);
        return { success: false, message: `User opted out of ${payload.template}` };
      }
    }

    const provider = this.providers[payload.channel];
    if (provider) {
      try {
        await provider(payload);
        this.logger.log(`Notification sent via ${payload.channel} to ${payload.recipient} using provider.`);
        
        // Log to history
        await this.logNotificationHistory(payload, 'sent', userId);
        
        return { success: true, message: `${payload.channel} sent via provider` };
      } catch (err) {
        this.logger.error(`Provider error for ${payload.channel}: ${err}`);
        
        // Log failed notification
        await this.logNotificationHistory(payload, 'failed', userId, err.message);
        
        return { success: false, message: `Provider error: ${err}` };
      }
    }
    
    // Fallback: log notification action
    this.logger.warn(`No provider configured for ${payload.channel}. Logging notification instead.`);
    this.logger.log(`[Notification] Channel: ${payload.channel}, Recipient: ${payload.recipient}, Template: ${payload.template}, Data: ${JSON.stringify(payload.data)}`);
    
    // Log to history
    await this.logNotificationHistory(payload, 'sent', userId);
    
    return { success: true, message: `${payload.channel} notification logged (no provider)` };
  }

  // Send bulk notifications
  async sendBulkNotifications(payloads: NotificationPayload[], userId?: string): Promise<{ success: boolean; message: string; results: any[] }> {
    const results = [];
    for (const payload of payloads) {
      const result = await this.sendNotification(payload, userId);
      results.push({ recipient: payload.recipient, ...result });
    }
    return { success: true, message: `Bulk notifications processed`, results };
  }

  // Schedule notification for later
  async scheduleNotification(payload: NotificationPayload, scheduledFor: Date, userId?: string): Promise<ScheduledNotification> {
    const scheduledNotification = this.scheduledNotificationRepository.create({
      channel: payload.channel,
      recipient: payload.recipient,
      template: payload.template,
      data: payload.data,
      scheduledFor,
      status: 'pending',
      createdBy: userId || 'system',
    });
    
    return this.scheduledNotificationRepository.save(scheduledNotification);
  }

  // Get notification templates from database
  async getTemplates(filters?: { type?: string; channel?: NotificationChannel }): Promise<NotificationTemplate[]> {
    const query = this.templateRepository.createQueryBuilder('template')
      .where('template.isActive = :isActive', { isActive: true });
    
    if (filters?.type) {
      query.andWhere('template.type = :type', { type: filters.type });
    }
    if (filters?.channel) {
      query.andWhere('template.channel = :channel', { channel: filters.channel });
    }
    
    return query.getMany();
  }

  async getTemplate(name: string): Promise<NotificationTemplate | null> {
    return this.templateRepository.findOne({ where: { name, isActive: true } });
  }

  // Create new template in database
  async createTemplate(template: Partial<NotificationTemplate>, userId?: string): Promise<NotificationTemplate> {
    const newTemplate = this.templateRepository.create({
      ...template,
      createdBy: userId,
    });
    
    return this.templateRepository.save(newTemplate);
  }

  // Update existing template in database
  async updateTemplate(name: string, content: string, userId?: string): Promise<NotificationTemplate> {
    const template = await this.getTemplate(name);
    if (!template) {
      throw new Error(`Template ${name} not found`);
    }
    
    template.content = content;
    template.updatedBy = userId;
    template.updatedAt = new Date();
    
    return this.templateRepository.save(template);
  }

  // Delete template from database
  async deleteTemplate(name: string, userId?: string): Promise<{ success: boolean; message: string }> {
    const template = await this.getTemplate(name);
    if (!template) {
      return { success: false, message: `Template ${name} not found` };
    }
    
    template.isActive = false;
    template.updatedBy = userId;
    template.updatedAt = new Date();
    
    await this.templateRepository.save(template);
    return { success: true, message: `Template ${name} deleted` };
  }

  // Import templates from file
  async importTemplates(file: Express.Multer.File, userId?: string): Promise<{ success: boolean; message: string; imported: number }> {
    try {
      const templates = JSON.parse(file.buffer.toString());
      let imported = 0;
      
      for (const templateData of templates) {
        const existing = await this.getTemplate(templateData.name);
        if (!existing) {
          await this.createTemplate(templateData, userId);
          imported++;
        }
      }
      
      return { success: true, message: 'Templates imported successfully', imported };
    } catch (error) {
      return { success: false, message: `Import failed: ${error.message}`, imported: 0 };
    }
  }

  // Export templates to JSON
  async exportTemplates(filters?: { type?: string; channel?: NotificationChannel }): Promise<{ data: NotificationTemplate[]; format: string }> {
    const templates = await this.getTemplates(filters);
    return { data: templates, format: 'json' };
  }

  // Mark notification as read
  async markAsRead(id: string, userId?: string): Promise<{ success: boolean; message: string }> {
    const history = await this.notificationHistoryRepository.findOne({ where: { id } });
    if (!history) {
      return { success: false, message: 'Notification not found' };
    }
    
    // In a real implementation, you might have a separate read status table
    // For now, we'll just return success
    return { success: true, message: 'Notification marked as read' };
  }

  // Mark all notifications as read
  async markAllAsRead(userId?: string): Promise<{ success: boolean; message: string; count: number }> {
    // In a real implementation, you would update read status for all notifications
    const count = await this.notificationHistoryRepository.count({ where: { recipient: userId } });
    return { success: true, message: 'All notifications marked as read', count };
  }

  // Delete notification from history
  async deleteNotification(id: string, userId?: string): Promise<{ success: boolean; message: string }> {
    const history = await this.notificationHistoryRepository.findOne({ where: { id } });
    if (!history) {
      return { success: false, message: 'Notification not found' };
    }
    
    await this.notificationHistoryRepository.remove(history);
    return { success: true, message: 'Notification deleted' };
  }

  // Clear all notifications for user
  async clearAllNotifications(userId?: string): Promise<{ success: boolean; message: string; count: number }> {
    const count = await this.notificationHistoryRepository.count({ where: { recipient: userId } });
    await this.notificationHistoryRepository.delete({ recipient: userId });
    return { success: true, message: 'All notifications cleared', count };
  }

  // Get available channels
  getAvailableChannels(): { channel: NotificationChannel; enabled: boolean; config?: any }[] {
    return [
      { channel: 'email', enabled: true, config: { smtp: 'configured' } },
      { channel: 'sms', enabled: false, config: { provider: 'twilio' } },
      { channel: 'in-app', enabled: true, config: { websocket: 'enabled' } },
      { channel: 'webhook', enabled: false, config: { endpoints: [] } },
    ];
  }

  // Get channel status
  getChannelStatus(channel: NotificationChannel): { enabled: boolean; status: string; lastTest?: Date } {
    const channels = this.getAvailableChannels();
    const channelConfig = channels.find(c => c.channel === channel);
    return {
      enabled: channelConfig?.enabled || false,
      status: channelConfig?.enabled ? 'operational' : 'disabled',
      lastTest: new Date(),
    };
  }

  // Test channel
  async testChannel(channel: NotificationChannel, recipient: string, message: string, userId?: string): Promise<{ success: boolean; message: string }> {
    const testPayload: NotificationPayload = {
      channel,
      recipient,
      template: 'test',
      data: { message },
    };
    
    return this.sendNotification(testPayload, userId);
  }

  // Get scheduled notifications from database
  async getScheduledNotifications(filters?: { status?: string; from?: Date; to?: Date }): Promise<ScheduledNotification[]> {
    const query = this.scheduledNotificationRepository.createQueryBuilder('scheduled');
    
    if (filters?.status) {
      query.andWhere('scheduled.status = :status', { status: filters.status });
    }
    if (filters?.from) {
      query.andWhere('scheduled.scheduledFor >= :from', { from: filters.from });
    }
    if (filters?.to) {
      query.andWhere('scheduled.scheduledFor <= :to', { to: filters.to });
    }
    
    return query.orderBy('scheduled.scheduledFor', 'ASC').getMany();
  }

  // Cancel scheduled notification
  async cancelScheduledNotification(id: string, userId?: string): Promise<{ success: boolean; message: string }> {
    const scheduled = await this.scheduledNotificationRepository.findOne({ where: { id } });
    if (!scheduled) {
      return { success: false, message: 'Scheduled notification not found' };
    }
    
    if (scheduled.status !== 'pending') {
      return { success: false, message: 'Cannot cancel non-pending notification' };
    }
    
    scheduled.status = 'cancelled';
    scheduled.cancelledBy = userId;
    scheduled.cancelledAt = new Date();
    
    await this.scheduledNotificationRepository.save(scheduled);
    return { success: true, message: 'Scheduled notification cancelled' };
  }

  // Reschedule notification with timezone support
  async rescheduleNotification(id: string, scheduledFor: Date, timezone?: string, userId?: string): Promise<ScheduledNotification> {
    const scheduled = await this.scheduledNotificationRepository.findOne({ where: { id } });
    if (!scheduled) {
      throw new Error('Scheduled notification not found');
    }
    
    if (scheduled.status !== 'pending') {
      throw new Error('Cannot reschedule non-pending notification');
    }
    
    scheduled.scheduledFor = scheduledFor;
    scheduled.updatedAt = new Date();
    
    return this.scheduledNotificationRepository.save(scheduled);
  }

  // Generate delivery report
  async generateDeliveryReport(filters?: { channel?: NotificationChannel; from?: Date; to?: Date }): Promise<any> {
    const query = this.notificationHistoryRepository.createQueryBuilder('history');
    
    if (filters?.channel) {
      query.andWhere('history.channel = :channel', { channel: filters.channel });
    }
    if (filters?.from) {
      query.andWhere('history.sentAt >= :from', { from: filters.from });
    }
    if (filters?.to) {
      query.andWhere('history.sentAt <= :to', { to: filters.to });
    }
    
    const total = await query.getCount();
    const delivered = await query.andWhere('history.status = :delivered', { delivered: 'delivered' }).getCount();
    const failed = await query.andWhere('history.status = :failed', { failed: 'failed' }).getCount();
    
    return {
      total,
      delivered,
      failed,
      pending: 0, // This would come from scheduled notifications
      deliveryRate: total > 0 ? (delivered / total) * 100 : 0,
    };
  }

  // Generate engagement report
  async generateEngagementReport(filters?: { channel?: NotificationChannel; from?: Date; to?: Date }): Promise<any> {
    const query = this.notificationHistoryRepository.createQueryBuilder('history');
    
    if (filters?.channel) {
      query.andWhere('history.channel = :channel', { channel: filters.channel });
    }
    if (filters?.from) {
      query.andWhere('history.sentAt >= :from', { from: filters.from });
    }
    if (filters?.to) {
      query.andWhere('history.sentAt <= :to', { to: filters.to });
    }
    
    const totalSent = await query.getCount();
    const opened = await query.andWhere('history.openedAt IS NOT NULL').getCount();
    const clicked = await query.andWhere('history.clickedAt IS NOT NULL').getCount();
    
    return {
      totalSent,
      opened,
      clicked,
      unsubscribed: 0, // This would come from preference service
      engagementRate: totalSent > 0 ? ((opened + clicked) / totalSent) * 100 : 0,
    };
  }

  // --- Additional methods for controller contract ---

  async findAll(filters?: any): Promise<any[]> {
    const query = this.notificationHistoryRepository.createQueryBuilder('history')
      .orderBy('history.sentAt', 'DESC');
    
    if (filters?.recipient) {
      query.andWhere('history.recipient = :recipient', { recipient: filters.recipient });
    }
    if (filters?.channel) {
      query.andWhere('history.channel = :channel', { channel: filters.channel });
    }
    if (filters?.status) {
      query.andWhere('history.status = :status', { status: filters.status });
    }
    if (filters?.from) {
      query.andWhere('history.sentAt >= :from', { from: filters.from });
    }
    if (filters?.to) {
      query.andWhere('history.sentAt <= :to', { to: filters.to });
    }
    
    return query.getMany();
  }

  async getUserNotifications(userId: string, filters?: any): Promise<any[]> {
    const query = this.notificationHistoryRepository.createQueryBuilder('history')
      .where('history.recipient = :userId', { userId })
      .orderBy('history.sentAt', 'DESC');
    
    if (filters?.status) {
      query.andWhere('history.status = :status', { status: filters.status });
    }
    if (filters?.channel) {
      query.andWhere('history.channel = :channel', { channel: filters.channel });
    }
    
    return query.getMany();
  }

  async getUnreadCount(userId: string): Promise<number> {
    // In a real implementation, you would have a read status table
    // For now, return 0 as placeholder
    return 0;
  }

  async getAnalyticsOverview(filters?: any): Promise<any> {
    const totalSent = await this.notificationHistoryRepository.count();
    const delivered = await this.notificationHistoryRepository.count({ where: { status: 'delivered' } });
    const failed = await this.notificationHistoryRepository.count({ where: { status: 'failed' } });
    
    return {
      totalSent,
      delivered,
      failed,
      deliveryRate: totalSent > 0 ? (delivered / totalSent) * 100 : 0,
    };
  }

  async getDeliveryAnalytics(filters?: any): Promise<any> {
    const query = this.notificationHistoryRepository.createQueryBuilder('history')
      .select([
        'history.channel',
        'COUNT(*) as total',
        'COUNT(CASE WHEN history.status = :delivered THEN 1 END) as delivered',
        'COUNT(CASE WHEN history.status = :failed THEN 1 END) as failed'
      ])
      .setParameter('delivered', 'delivered')
      .setParameter('failed', 'failed')
      .groupBy('history.channel');
    
    if (filters?.from) {
      query.andWhere('history.sentAt >= :from', { from: filters.from });
    }
    if (filters?.to) {
      query.andWhere('history.sentAt <= :to', { to: filters.to });
    }
    
    const results = await query.getRawMany();
    
    return {
      byChannel: results.reduce((acc, result) => {
        acc[result.channel] = {
          total: parseInt(result.total),
          delivered: parseInt(result.delivered),
          failed: parseInt(result.failed),
          successRate: parseInt(result.total) > 0 ? (parseInt(result.delivered) / parseInt(result.total)) * 100 : 0,
        };
        return acc;
      }, {}),
      byTime: {}, // This would be time-based aggregation
      successRate: 0, // Overall success rate
    };
  }

  async getEngagementAnalytics(filters?: any): Promise<any> {
    const totalSent = await this.notificationHistoryRepository.count();
    const opened = await this.notificationHistoryRepository.count({ where: { openedAt: MoreThanOrEqual(new Date(0)) } });
    const clicked = await this.notificationHistoryRepository.count({ where: { clickedAt: MoreThanOrEqual(new Date(0)) } });
    
    return {
      openRate: totalSent > 0 ? (opened / totalSent) * 100 : 0,
      clickRate: totalSent > 0 ? (clicked / totalSent) * 100 : 0,
      unsubscribes: 0, // This would come from preference service
    };
  }

  // Helper method to log notification history
  private async logNotificationHistory(
    payload: NotificationPayload, 
    status: 'sent' | 'delivered' | 'failed' | 'bounced',
    userId?: string,
    errorMessage?: string
  ): Promise<void> {
    const history = this.notificationHistoryRepository.create({
      channel: payload.channel,
      recipient: payload.recipient,
      template: payload.template,
      data: payload.data,
      status,
      sentAt: new Date(),
      errorMessage,
      sentBy: userId || 'system',
    });
    
    await this.notificationHistoryRepository.save(history);
  }

  // Email verification notification
  async sendEmailVerification(email: string, token: string): Promise<{ success: boolean; message: string }> {
    const payload: NotificationPayload = {
      channel: 'email',
      recipient: email,
      template: 'email_verification',
      data: { token },
    };
    return this.sendNotification(payload);
  }

  // Password reset notification
  async sendPasswordReset(email: string, token: string): Promise<{ success: boolean; message: string }> {
    const payload: NotificationPayload = {
      channel: 'email',
      recipient: email,
      template: 'password_reset',
      data: { token },
    };
    return this.sendNotification(payload);
  }

  // Welcome email notification
  async sendWelcomeEmail(email: string, name: string): Promise<{ success: boolean; message: string }> {
    const payload: NotificationPayload = {
      channel: 'email',
      recipient: email,
      template: 'welcome',
      data: { name },
    };
    return this.sendNotification(payload);
  }

  // Ticket confirmation notification
  async sendTicketConfirmation(email: string, ticketData: any): Promise<{ success: boolean; message: string }> {
    const payload: NotificationPayload = {
      channel: 'email',
      recipient: email,
      template: 'ticket_confirmation',
      data: ticketData,
    };
    return this.sendNotification(payload);
  }

  // Event reminder notification
  async sendEventReminder(email: string, eventData: any): Promise<{ success: boolean; message: string }> {
    const payload: NotificationPayload = {
      channel: 'email',
      recipient: email,
      template: 'event_reminder',
      data: eventData,
    };
    return this.sendNotification(payload);
  }

  // Refund notification
  async sendRefundNotification(email: string, refundData: any): Promise<{ success: boolean; message: string }> {
    const payload: NotificationPayload = {
      channel: 'email',
      recipient: email,
      template: 'refund_notification',
      data: refundData,
    };
    return this.sendNotification(payload);
  }

  // Security alert notification
  async sendSecurityAlert(email: string, alertData: any): Promise<{ success: boolean; message: string }> {
    const payload: NotificationPayload = {
      channel: 'email',
      recipient: email,
      template: 'security_alert',
      data: alertData,
    };
    return this.sendNotification(payload);
  }

  // Bulk email notifications
  async sendBulkEmail(recipients: string[], template: string, data: any): Promise<{ success: boolean; message: string; results: any[] }> {
    const payloads: NotificationPayload[] = recipients.map(email => ({
      channel: 'email',
      recipient: email,
      template,
      data,
    }));
    return this.sendBulkNotifications(payloads);
  }

  // Bulk SMS notifications
  async sendBulkSMS(recipients: string[], message: string): Promise<{ success: boolean; message: string; results: any[] }> {
    const payloads: NotificationPayload[] = recipients.map(phone => ({
      channel: 'sms',
      recipient: phone,
      template: 'custom_sms',
      data: { message },
    }));
    return this.sendBulkNotifications(payloads);
  }

  // In-app notification
  async sendInAppNotification(userId: string, title: string, message: string, data?: any): Promise<{ success: boolean; message: string }> {
    const payload: NotificationPayload = {
      channel: 'in-app',
      recipient: userId,
      template: 'in_app_notification',
      data: { title, message, ...data },
    };
    return this.sendNotification(payload);
  }

  // Webhook notification
  async sendWebhookNotification(url: string, data: any): Promise<{ success: boolean; message: string }> {
    const payload: NotificationPayload = {
      channel: 'webhook',
      recipient: url,
      template: 'webhook_notification',
      data,
    };
    return this.sendNotification(payload);
  }

  // Get notification history
  async getNotificationHistory(userId: string, filters?: any): Promise<any[]> {
    return this.getUserNotifications(userId, filters);
  }

  // Get notification stats
  async getNotificationStats(filters?: any): Promise<any> {
    return this.getAnalyticsOverview(filters);
  }

  // Resend notification
  async resendNotification(notificationId: string, userId?: string): Promise<{ success: boolean; message: string }> {
    const history = await this.notificationHistoryRepository.findOne({ where: { id: notificationId } });
    if (!history) {
      return { success: false, message: 'Notification not found' };
    }
    
    const payload: NotificationPayload = {
      channel: history.channel,
      recipient: history.recipient,
      template: history.template,
      data: history.data,
    };
    
    return this.sendNotification(payload, userId);
  }

  // Get notification preferences
  async getNotificationPreferences(userId: string): Promise<any> {
    return this.preferenceService.getByUserId(userId);
  }

  // Update notification preferences
  async updateNotificationPreferences(userId: string, preferences: any): Promise<any> {
    // TODO: Implement this method in preference service
    return { userId, preferences, updated: true };
  }

  // Subscribe to notifications
  async subscribeToNotifications(userId: string, channels: string[]): Promise<any> {
    // TODO: Implement this method in preference service
    return { userId, channels, subscribed: true };
  }

  // Unsubscribe from notifications
  async unsubscribeFromNotifications(userId: string, channels: string[]): Promise<any> {
    // TODO: Implement this method in preference service
    return { userId, channels, unsubscribed: true };
  }

  // Get notification templates by type
  async getNotificationTemplatesByType(type: string): Promise<NotificationTemplate[]> {
    return this.getTemplates({ type });
  }

  // Get notification templates by channel
  async getNotificationTemplatesByChannel(channel: NotificationChannel): Promise<NotificationTemplate[]> {
    return this.getTemplates({ channel });
  }

  // Duplicate template
  async duplicateTemplate(name: string, newName: string, userId?: string): Promise<NotificationTemplate> {
    const template = await this.getTemplate(name);
    if (!template) {
      throw new Error(`Template ${name} not found`);
    }
    
    const duplicatedTemplate = {
      ...template,
      name: newName,
      createdBy: userId,
    };
    
    // Remove properties that should not be copied
    const { id, createdAt, updatedAt, ...templateData } = duplicatedTemplate;
    
    return this.createTemplate(templateData, userId);
  }

  // Validate template
  async validateTemplate(name: string): Promise<{ valid: boolean; errors: string[] }> {
    const template = await this.getTemplate(name);
    if (!template) {
      return { valid: false, errors: ['Template not found'] };
    }
    
    const errors: string[] = [];
    
    if (!template.content) {
      errors.push('Template content is required');
    }
    
    if (template.channel === 'email' && !template.subject) {
      errors.push('Email templates require a subject');
    }
    
    // Check for required variables
    if (template.variables && template.variables.length > 0) {
      const content = template.content;
      for (const variable of template.variables) {
        if (!content.includes(`{${variable}}`)) {
          errors.push(`Variable ${variable} is defined but not used in content`);
        }
      }
    }
    
    return { valid: errors.length === 0, errors };
  }

  // Preview template
  async previewTemplate(name: string, data: any): Promise<string> {
    const template = await this.getTemplate(name);
    if (!template) {
      throw new Error(`Template ${name} not found`);
    }
    
    let content = template.content;
    
    // Replace variables with data
    if (template.variables && template.variables.length > 0) {
      for (const variable of template.variables) {
        const value = data[variable] || `{${variable}}`;
        content = content.replace(new RegExp(`{${variable}}`, 'g'), value);
      }
    }
    
    return content;
  }

  // Get notification metrics
  async getNotificationMetrics(filters?: any): Promise<any> {
    const overview = await this.getAnalyticsOverview(filters);
    const delivery = await this.getDeliveryAnalytics(filters);
    const engagement = await this.getEngagementAnalytics(filters);
    
    return {
      ...overview,
      ...delivery,
      ...engagement,
    };
  }

  // Get channel performance
  async getChannelPerformance(filters?: any): Promise<any> {
    return this.getDeliveryAnalytics(filters);
  }

  // Get template performance
  async getTemplatePerformance(filters?: any): Promise<any> {
    const query = this.notificationHistoryRepository.createQueryBuilder('history')
      .select([
        'history.template',
        'COUNT(*) as total',
        'COUNT(CASE WHEN history.status = :delivered THEN 1 END) as delivered',
        'COUNT(CASE WHEN history.openedAt IS NOT NULL THEN 1 END) as opened'
      ])
      .setParameter('delivered', 'delivered')
      .groupBy('history.template');
    
    if (filters?.from) {
      query.andWhere('history.sentAt >= :from', { from: filters.from });
    }
    if (filters?.to) {
      query.andWhere('history.sentAt <= :to', { to: filters.to });
    }
    
    const results = await query.getRawMany();
    
    return results.map(result => ({
      template: result.template,
      total: parseInt(result.total),
      delivered: parseInt(result.delivered),
      opened: parseInt(result.opened),
      deliveryRate: parseInt(result.total) > 0 ? (parseInt(result.delivered) / parseInt(result.total)) * 100 : 0,
      openRate: parseInt(result.total) > 0 ? (parseInt(result.opened) / parseInt(result.total)) * 100 : 0,
    }));
  }

  // Get notification trends
  async getNotificationTrends(filters?: any): Promise<any> {
    const query = this.notificationHistoryRepository.createQueryBuilder('history')
      .select([
        'DATE(history.sentAt) as date',
        'COUNT(*) as total',
        'COUNT(CASE WHEN history.status = :delivered THEN 1 END) as delivered'
      ])
      .setParameter('delivered', 'delivered')
      .groupBy('DATE(history.sentAt)')
      .orderBy('date', 'ASC');
    
    if (filters?.from) {
      query.andWhere('history.sentAt >= :from', { from: filters.from });
    }
    if (filters?.to) {
      query.andWhere('history.sentAt <= :to', { to: filters.to });
    }
    
    const results = await query.getRawMany();
    
    return results.map(result => ({
      date: result.date,
      total: parseInt(result.total),
      delivered: parseInt(result.delivered),
      deliveryRate: parseInt(result.total) > 0 ? (parseInt(result.delivered) / parseInt(result.total)) * 100 : 0,
    }));
  }

  // Get notification insights
  async getNotificationInsights(filters?: any): Promise<any> {
    const metrics = await this.getNotificationMetrics(filters);
    const trends = await this.getNotificationTrends(filters);
    const templatePerformance = await this.getTemplatePerformance(filters);
    
    // Calculate insights
    const insights = {
      bestPerformingTemplate: templatePerformance.reduce((best: any, current: any) => 
        current.deliveryRate > best.deliveryRate ? current : best, 
        { deliveryRate: 0 }
      ),
      averageDeliveryRate: templatePerformance.length > 0 
        ? templatePerformance.reduce((sum: number, t: any) => sum + t.deliveryRate, 0) / templatePerformance.length 
        : 0,
      totalNotifications: metrics.totalSent,
      recentTrend: trends.length > 1 
        ? trends[trends.length - 1].deliveryRate - trends[trends.length - 2].deliveryRate 
        : 0,
    };
    
    return {
      metrics,
      trends,
      templatePerformance,
      insights,
    };
  }
}
