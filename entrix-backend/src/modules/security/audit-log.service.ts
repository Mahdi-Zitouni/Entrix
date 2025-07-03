import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { AuditLog } from './audit-log.entity';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { UpdateAuditLogDto } from './dto/update-audit-log.dto';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async findAll(filters?: any): Promise<{ data: AuditLog[]; total: number; page: number; limit: number }> {
    const qb = this.auditLogRepository.createQueryBuilder('log')
      .orderBy('log.createdAt', 'DESC');
    
    if (filters?.userId) qb.andWhere('log.userId = :userId', { userId: filters.userId });
    if (filters?.action) qb.andWhere('log.action = :action', { action: filters.action });
    if (filters?.entityType) qb.andWhere('log.entityType = :entityType', { entityType: filters.entityType });
    if (filters?.entityId) qb.andWhere('log.entityId = :entityId', { entityId: filters.entityId });
    if (filters?.from) qb.andWhere('log.createdAt >= :from', { from: filters.from });
    if (filters?.to) qb.andWhere('log.createdAt <= :to', { to: filters.to });
    if (filters?.success !== undefined) qb.andWhere('log.success = :success', { success: filters.success });
    if (filters?.severity) qb.andWhere('log.severity = :severity', { severity: filters.severity });
    
    const total = await qb.getCount();
    
    if (filters?.page && filters?.limit) {
      qb.skip((filters.page - 1) * filters.limit).take(filters.limit);
    }
    
    const data = await qb.getMany();
    
    return {
      data,
      total,
      page: filters?.page || 1,
      limit: filters?.limit || 20,
    };
  }

  async findOne(id: string): Promise<AuditLog> {
    const log = await this.auditLogRepository.findOne({ where: { id } });
    if (!log) throw new NotFoundException('Audit log not found');
    return log;
  }

  async create(createDto: CreateAuditLogDto, requestedBy?: string): Promise<AuditLog> {
    const log = this.auditLogRepository.create(createDto);
    return this.auditLogRepository.save(log);
  }

  async update(id: string, updateDto: UpdateAuditLogDto, updatedBy?: string): Promise<AuditLog> {
    const log = await this.findOne(id);
    Object.assign(log, updateDto);
    return this.auditLogRepository.save(log);
  }

  async remove(id: string, removedBy?: string): Promise<void> {
    const log = await this.findOne(id);
    await this.auditLogRepository.remove(log);
  }

  // Generic logAction for use by other modules
  async logAction(params: {
    action: string;
    entityType: string;
    entityId?: string;
    userId?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    oldValues?: any;
    newValues?: any;
    metadata?: any;
    severity?: string;
    success?: boolean;
    errorMessage?: string;
    durationMs?: number;
  }): Promise<AuditLog> {
    const log = this.auditLogRepository.create({
      ...params,
      severity: params.severity || 'MEDIUM',
      success: params.success !== false,
      createdAt: new Date(),
    });
    return this.auditLogRepository.save(log);
  }

  // Advanced query/filtering for admin review
  async findByQuery(query: {
    userId?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    from?: Date;
    to?: Date;
    success?: boolean;
    severity?: string;
  }): Promise<AuditLog[]> {
    const qb = this.auditLogRepository.createQueryBuilder('log');
    if (query.userId)
      qb.andWhere('log.userId = :userId', { userId: query.userId });
    if (query.action)
      qb.andWhere('log.action = :action', { action: query.action });
    if (query.entityType)
      qb.andWhere('log.entityType = :entityType', {
        entityType: query.entityType,
      });
    if (query.entityId)
      qb.andWhere('log.entityId = :entityId', { entityId: query.entityId });
    if (query.from) qb.andWhere('log.createdAt >= :from', { from: query.from });
    if (query.to) qb.andWhere('log.createdAt <= :to', { to: query.to });
    if (query.success !== undefined)
      qb.andWhere('log.success = :success', { success: query.success });
    if (query.severity)
      qb.andWhere('log.severity = :severity', { severity: query.severity });
    qb.orderBy('log.createdAt', 'DESC');
    return qb.getMany();
  }

  async searchAuditLogs(query: string, filters?: any): Promise<AuditLog[]> {
    const qb = this.auditLogRepository.createQueryBuilder('log')
      .where('log.action ILIKE :query OR log.entityType ILIKE :query OR log.userId ILIKE :query', 
        { query: `%${query}%` });
    
    if (filters?.userId) qb.andWhere('log.userId = :userId', { userId: filters.userId });
    if (filters?.action) qb.andWhere('log.action = :action', { action: filters.action });
    if (filters?.severity) qb.andWhere('log.severity = :severity', { severity: filters.severity });
    if (filters?.from) qb.andWhere('log.createdAt >= :from', { from: filters.from });
    if (filters?.to) qb.andWhere('log.createdAt <= :to', { to: filters.to });
    
    return qb.orderBy('log.createdAt', 'DESC').getMany();
  }

  async getUserActivity(userId: string, filters?: any): Promise<AuditLog[]> {
    const qb = this.auditLogRepository.createQueryBuilder('log')
      .where('log.userId = :userId', { userId });
    
    if (filters?.action) qb.andWhere('log.action = :action', { action: filters.action });
    if (filters?.from) qb.andWhere('log.createdAt >= :from', { from: filters.from });
    if (filters?.to) qb.andWhere('log.createdAt <= :to', { to: filters.to });
    
    return qb.orderBy('log.createdAt', 'DESC').getMany();
  }

  async getAnalyticsOverview(filters?: any): Promise<any> {
    const qb = this.auditLogRepository.createQueryBuilder('log')
      .select([
        'COUNT(*) as totalLogs',
        'COUNT(CASE WHEN log.severity = :high THEN 1 END) as highSeverity',
        'COUNT(CASE WHEN log.severity = :medium THEN 1 END) as mediumSeverity',
        'COUNT(CASE WHEN log.severity = :low THEN 1 END) as lowSeverity',
        'COUNT(CASE WHEN log.success = false THEN 1 END) as failedActions'
      ])
      .setParameter('high', 'HIGH')
      .setParameter('medium', 'MEDIUM')
      .setParameter('low', 'LOW');
    
    if (filters?.from) qb.andWhere('log.createdAt >= :from', { from: filters.from });
    if (filters?.to) qb.andWhere('log.createdAt <= :to', { to: filters.to });
    
    const result = await qb.getRawOne();
    
    return {
      totalLogs: parseInt(result.totalLogs),
      highSeverity: parseInt(result.highSeverity),
      mediumSeverity: parseInt(result.mediumSeverity),
      lowSeverity: parseInt(result.lowSeverity),
      failedActions: parseInt(result.failedActions),
      successRate: result.totalLogs > 0 ? ((result.totalLogs - result.failedActions) / result.totalLogs) * 100 : 0
    };
  }

  async getThreatAnalytics(filters?: any): Promise<any> {
    const qb = this.auditLogRepository.createQueryBuilder('log')
      .select([
        'log.action',
        'COUNT(*) as count',
        'COUNT(CASE WHEN log.success = false THEN 1 END) as failures'
      ])
      .where('log.severity = :severity', { severity: 'HIGH' })
      .groupBy('log.action');
    
    if (filters?.from) qb.andWhere('log.createdAt >= :from', { from: filters.from });
    if (filters?.to) qb.andWhere('log.createdAt <= :to', { to: filters.to });
    
    const threats = await qb.getRawMany();
    
    return {
      totalThreats: threats.reduce((sum, t) => sum + parseInt(t.count), 0),
      threatsByType: threats.map(t => ({
        action: t.action,
        count: parseInt(t.count),
        failures: parseInt(t.failures)
      }))
    };
  }

  async getActionAnalytics(filters?: any): Promise<any> {
    const qb = this.auditLogRepository.createQueryBuilder('log')
      .select([
        'log.action',
        'COUNT(*) as count',
        'AVG(log.durationMs) as avgDuration'
      ])
      .groupBy('log.action')
      .orderBy('count', 'DESC');
    
    if (filters?.from) qb.andWhere('log.createdAt >= :from', { from: filters.from });
    if (filters?.to) qb.andWhere('log.createdAt <= :to', { to: filters.to });
    
    const actions = await qb.getRawMany();
    
    return {
      totalActions: actions.reduce((sum, a) => sum + parseInt(a.count), 0),
      actionsByType: actions.map(a => ({
        action: a.action,
        count: parseInt(a.count),
        avgDuration: parseFloat(a.avgDuration) || 0
      }))
    };
  }

  async getUserAnalytics(filters?: any): Promise<any> {
    const qb = this.auditLogRepository.createQueryBuilder('log')
      .select([
        'log.userId',
        'COUNT(*) as actionCount',
        'COUNT(CASE WHEN log.success = false THEN 1 END) as failureCount'
      ])
      .groupBy('log.userId')
      .orderBy('actionCount', 'DESC');
    
    if (filters?.from) qb.andWhere('log.createdAt >= :from', { from: filters.from });
    if (filters?.to) qb.andWhere('log.createdAt <= :to', { to: filters.to });
    
    const users = await qb.getRawMany();
    
    return {
      totalUsers: users.length,
      totalActions: users.reduce((sum, u) => sum + parseInt(u.actionCount), 0),
      userActivity: users.map(u => ({
        userId: u.userId,
        actionCount: parseInt(u.actionCount),
        failureCount: parseInt(u.failureCount),
        successRate: u.actionCount > 0 ? ((u.actionCount - u.failureCount) / u.actionCount) * 100 : 0
      }))
    };
  }

  async getActiveThreats(): Promise<any[]> {
    const qb = this.auditLogRepository.createQueryBuilder('log')
      .where('log.severity = :severity', { severity: 'HIGH' })
      .andWhere('log.success = false')
      .andWhere('log.createdAt >= :recent', { recent: new Date(Date.now() - 24 * 60 * 60 * 1000) })
      .orderBy('log.createdAt', 'DESC');
    
    const threats = await qb.getMany();
    
    return threats.map(threat => ({
      id: threat.id,
      type: threat.action,
      severity: threat.severity,
      description: threat.errorMessage || 'Security threat detected',
      detectedAt: threat.createdAt,
      status: 'ACTIVE'
    }));
  }

  async getThreatDetails(id: string): Promise<any> {
    const threat = await this.findOne(id);
    
    return {
      id: threat.id,
      type: threat.action,
      severity: threat.severity,
      description: threat.errorMessage || 'Security threat detected',
      detectedAt: threat.createdAt,
      status: 'ACTIVE',
      details: {
        userId: threat.userId,
        entityType: threat.entityType,
        entityId: threat.entityId,
        ipAddress: threat.ipAddress,
        userAgent: threat.userAgent,
        metadata: threat.metadata
      }
    };
  }

  async acknowledgeThreat(id: string, notes?: string, userId?: string): Promise<any> {
    const threat = await this.findOne(id);
    
    // In a real implementation, you might update a separate threats table
    // For now, we'll just log the acknowledgment
    await this.logAction({
      action: 'THREAT_ACKNOWLEDGED',
      entityType: 'SECURITY_THREAT',
      entityId: id,
      userId,
      metadata: { notes },
      severity: 'MEDIUM',
      success: true
    });
    
    return { id, acknowledged: true, notes, acknowledgedBy: userId, acknowledgedAt: new Date() };
  }

  async resolveThreat(id: string, resolution?: string, notes?: string, userId?: string): Promise<any> {
    const threat = await this.findOne(id);
    
    // Log the resolution
    await this.logAction({
      action: 'THREAT_RESOLVED',
      entityType: 'SECURITY_THREAT',
      entityId: id,
      userId,
      metadata: { resolution, notes },
      severity: 'MEDIUM',
      success: true
    });
    
    return { id, resolved: true, resolution, notes, resolvedBy: userId, resolvedAt: new Date() };
  }

  async getSecurityAlerts(filters?: any): Promise<any[]> {
    const qb = this.auditLogRepository.createQueryBuilder('log')
      .where('log.severity IN (:...severities)', { severities: ['HIGH', 'MEDIUM'] })
      .andWhere('log.success = false')
      .orderBy('log.createdAt', 'DESC');
    
    if (filters?.severity) qb.andWhere('log.severity = :severity', { severity: filters.severity });
    if (filters?.from) qb.andWhere('log.createdAt >= :from', { from: filters.from });
    if (filters?.to) qb.andWhere('log.createdAt <= :to', { to: filters.to });
    
    const alerts = await qb.getMany();
    
    return alerts.map(alert => ({
      id: alert.id,
      severity: alert.severity,
      action: alert.action,
      description: alert.errorMessage || 'Security alert',
      createdAt: alert.createdAt,
      status: 'ACTIVE'
    }));
  }

  async acknowledgeAlert(id: string, notes?: string, userId?: string): Promise<any> {
    const alert = await this.findOne(id);
    
    await this.logAction({
      action: 'ALERT_ACKNOWLEDGED',
      entityType: 'SECURITY_ALERT',
      entityId: id,
      userId,
      metadata: { notes },
      severity: 'LOW',
      success: true
    });
    
    return { id, acknowledged: true, notes, acknowledgedBy: userId, acknowledgedAt: new Date() };
  }

  async getAuditLogDetails(id: string): Promise<any> {
    const log = await this.findOne(id);
    
    return {
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      userId: log.userId,
      severity: log.severity,
      success: log.success,
      createdAt: log.createdAt,
      details: {
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        sessionId: log.sessionId,
        oldValues: log.oldValues,
        newValues: log.newValues,
        metadata: log.metadata,
        errorMessage: log.errorMessage,
        durationMs: log.durationMs
      }
    };
  }

  async getRelatedAuditLogs(id: string): Promise<AuditLog[]> {
    const log = await this.findOne(id);
    
    const qb = this.auditLogRepository.createQueryBuilder('related')
      .where('related.userId = :userId', { userId: log.userId })
      .andWhere('related.id != :id', { id })
      .andWhere('related.createdAt >= :recent', { 
        recent: new Date(log.createdAt.getTime() - 60 * 60 * 1000) // 1 hour before
      })
      .orderBy('related.createdAt', 'DESC')
      .limit(10);
    
    return qb.getMany();
  }

  async bulkCreate(createDtos: CreateAuditLogDto[], requestedBy?: string): Promise<AuditLog[]> {
    const logs = this.auditLogRepository.create(createDtos);
    return this.auditLogRepository.save(logs);
  }

  async updateSeverity(id: string, severity: string, reason?: string, updatedBy?: string): Promise<AuditLog> {
    const log = await this.findOne(id);
    log.severity = severity;
    
    // Log the severity update
    await this.logAction({
      action: 'SEVERITY_UPDATED',
      entityType: 'AUDIT_LOG',
      entityId: id,
      userId: updatedBy,
      metadata: { reason, oldSeverity: log.severity, newSeverity: severity },
      severity: 'LOW',
      success: true
    });
    
    return this.auditLogRepository.save(log);
  }

  async getRetentionPolicy(): Promise<any> {
    return {
      defaultRetentionDays: 90,
      sensitiveDataRetentionDays: 365,
      complianceRetentionDays: 2555, // 7 years
      autoCleanup: true,
      archiveBeforeDelete: true,
      lastCleanup: new Date(),
      nextCleanup: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
    };
  }

  async updateRetentionPolicy(policy: any, updatedBy?: string): Promise<any> {
    // In a real implementation, you would store this in a configuration table
    await this.logAction({
      action: 'RETENTION_POLICY_UPDATED',
      entityType: 'SYSTEM_CONFIG',
      userId: updatedBy,
      oldValues: await this.getRetentionPolicy(),
      newValues: policy,
      severity: 'MEDIUM',
      success: true
    });
    
    return { ...policy, updatedBy, updatedAt: new Date() };
  }

  async cleanupOldLogs(olderThan: Date, dryRun: boolean, removedBy?: string): Promise<any> {
    const cutoffDate = olderThan;
    
    if (dryRun) {
      const count = await this.auditLogRepository.count({
        where: { createdAt: LessThan(cutoffDate) }
      });
      return { dryRun: true, logsToDelete: count, cutoffDate };
    }
    
    const result = await this.auditLogRepository.delete({
      createdAt: LessThan(cutoffDate)
    });
    
    // Log the cleanup operation
    await this.logAction({
      action: 'LOGS_CLEANED_UP',
      entityType: 'SYSTEM_MAINTENANCE',
      userId: removedBy,
      metadata: { cutoffDate, deletedCount: result.affected },
      severity: 'LOW',
      success: true
    });
    
    return { deleted: result.affected, cutoffDate };
  }

  async getGdprComplianceData(filters?: any): Promise<any> {
    const qb = this.auditLogRepository.createQueryBuilder('log')
      .where('log.action IN (:...actions)', { 
        actions: ['USER_DATA_ACCESSED', 'USER_DATA_EXPORTED', 'USER_DATA_DELETED', 'USER_CONSENT_UPDATED'] 
      });
    
    if (filters?.from) qb.andWhere('log.createdAt >= :from', { from: filters.from });
    if (filters?.to) qb.andWhere('log.createdAt <= :to', { to: filters.to });
    
    const logs = await qb.getMany();
    
    return {
      totalAccesses: logs.filter(l => l.action === 'USER_DATA_ACCESSED').length,
      totalExports: logs.filter(l => l.action === 'USER_DATA_EXPORTED').length,
      totalDeletions: logs.filter(l => l.action === 'USER_DATA_DELETED').length,
      consentUpdates: logs.filter(l => l.action === 'USER_CONSENT_UPDATED').length,
      logs,
    };
  }

  async getSoxComplianceData(filters?: any): Promise<any> {
    const qb = this.auditLogRepository.createQueryBuilder('log')
      .where('log.action IN (:...actions)', { 
        actions: ['FINANCIAL_TRANSACTION', 'ACCESS_CONTROL_CHANGE', 'SYSTEM_CONFIGURATION_CHANGE'] 
      });
    
    if (filters?.from) qb.andWhere('log.createdAt >= :from', { from: filters.from });
    if (filters?.to) qb.andWhere('log.createdAt <= :to', { to: filters.to });
    
    const logs = await qb.getMany();
    
    return {
      financialTransactions: logs.filter(l => l.action === 'FINANCIAL_TRANSACTION').length,
      accessControlChanges: logs.filter(l => l.action === 'ACCESS_CONTROL_CHANGE').length,
      systemChanges: logs.filter(l => l.action === 'SYSTEM_CONFIGURATION_CHANGE').length,
      logs,
    };
  }

  async getPciComplianceData(filters?: any): Promise<any> {
    const qb = this.auditLogRepository.createQueryBuilder('log')
      .where('log.action IN (:...actions)', { 
        actions: ['PAYMENT_PROCESSED', 'CARD_DATA_ACCESSED', 'SECURITY_INCIDENT'] 
      });
    
    if (filters?.from) qb.andWhere('log.createdAt >= :from', { from: filters.from });
    if (filters?.to) qb.andWhere('log.createdAt <= :to', { to: filters.to });
    
    const logs = await qb.getMany();
    
    return {
      paymentsProcessed: logs.filter(l => l.action === 'PAYMENT_PROCESSED').length,
      cardDataAccesses: logs.filter(l => l.action === 'CARD_DATA_ACCESSED').length,
      securityIncidents: logs.filter(l => l.action === 'SECURITY_INCIDENT').length,
      logs,
    };
  }

  async generateSecurityReport(filters?: any, format: string = 'csv'): Promise<any> {
    const logs = await this.findAll(filters);
    
    if (format === 'csv') {
      const headers = ['id', 'userId', 'action', 'entityType', 'entityId', 'success', 'severity', 'createdAt'];
      const csvContent = [
        headers.join(','),
        ...logs.data.map(log => headers.map(header => (log as any)[header]).join(','))
      ].join('\n');
      return csvContent;
    }
    
    return logs;
  }

  async generateComplianceReport(standard: string, filters?: any, format: string = 'csv'): Promise<any> {
    let data;
    switch (standard.toLowerCase()) {
      case 'gdpr':
        data = await this.getGdprComplianceData(filters);
        break;
      case 'sox':
        data = await this.getSoxComplianceData(filters);
        break;
      case 'pci':
        data = await this.getPciComplianceData(filters);
        break;
      default:
        throw new Error(`Unsupported compliance standard: ${standard}`);
    }
    
    if (format === 'csv') {
      const headers = Object.keys(data).filter(key => key !== 'logs');
      const csvContent = [
        headers.join(','),
        headers.map(header => data[header]).join(',')
      ].join('\n');
      return csvContent;
    }
    
    return data;
  }

  async generateThreatReport(filters?: any, format: string = 'csv'): Promise<any> {
    const threats = await this.getActiveThreats();
    
    if (format === 'csv') {
      const headers = ['id', 'type', 'severity', 'description', 'detectedAt', 'status'];
      const csvContent = [
        headers.join(','),
        ...threats.map(threat => headers.map(header => (threat as any)[header]).join(','))
      ].join('\n');
      return csvContent;
    }
    
    return threats;
  }

  async exportAuditLogs(filters: any, format: string = 'csv'): Promise<any> {
    const logs = await this.findAll(filters);
    
    if (format === 'csv') {
      const headers = ['id', 'userId', 'action', 'entityType', 'entityId', 'success', 'severity', 'createdAt'];
      const csvContent = [
        headers.join(','),
        ...logs.data.map(log => headers.map(header => (log as any)[header]).join(','))
      ].join('\n');
      return csvContent;
    }
    
    return logs;
  }
}
