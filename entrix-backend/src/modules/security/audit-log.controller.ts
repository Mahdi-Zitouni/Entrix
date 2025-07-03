import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  Res,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { AuditLogService } from './audit-log.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { UpdateAuditLogDto } from './dto/update-audit-log.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Response } from 'express';

@ApiTags('Audit Logs')
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'security_manager', 'auditor')
  @ApiOperation({ summary: 'Get all audit logs with optional filtering' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'action', required: false, description: 'Filter by action' })
  @ApiQuery({ name: 'entityType', required: false, description: 'Filter by entity type' })
  @ApiQuery({ name: 'entityId', required: false, description: 'Filter by entity ID' })
  @ApiQuery({ name: 'from', required: false, description: 'Filter from date' })
  @ApiQuery({ name: 'to', required: false, description: 'Filter to date' })
  @ApiQuery({ name: 'success', required: false, description: 'Filter by success status' })
  @ApiQuery({ name: 'severity', required: false, description: 'Filter by severity' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  async findAll(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('success') success?: string,
    @Query('severity') severity?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.auditLogService.findAll({
      userId,
      action,
      entityType,
      entityId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      success: success !== undefined ? success === 'true' : undefined,
      severity,
      page: page || 1,
      limit: limit || 20,
    });
  }

  @Get('search')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'security_manager')
  @ApiOperation({ summary: 'Advanced audit log search' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'filters', required: false, description: 'JSON filters' })
  async searchAuditLogs(
    @Query('q') query: string,
    @Query('filters') filters?: string,
  ) {
    const parsedFilters = filters ? JSON.parse(filters) : {};
    return this.auditLogService.searchAuditLogs(query, parsedFilters);
  }

  @Get('my-activity')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user activity logs' })
  @ApiQuery({ name: 'action', required: false, description: 'Filter by action' })
  @ApiQuery({ name: 'from', required: false, description: 'From date' })
  @ApiQuery({ name: 'to', required: false, description: 'To date' })
  async getMyActivity(
    @Request() req: any,
    @Query('action') action?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.auditLogService.getUserActivity(req.user.id, {
      action,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('analytics/overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'security_manager', 'analyst')
  @ApiOperation({ summary: 'Get security analytics overview' })
  @ApiQuery({ name: 'from', required: false, description: 'From date' })
  @ApiQuery({ name: 'to', required: false, description: 'To date' })
  async getAnalyticsOverview(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.auditLogService.getAnalyticsOverview({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('analytics/threats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'security_manager', 'analyst')
  @ApiOperation({ summary: 'Get threat detection analytics' })
  async getThreatAnalytics(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.auditLogService.getThreatAnalytics({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('analytics/actions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'security_manager', 'analyst')
  @ApiOperation({ summary: 'Get action analytics' })
  async getActionAnalytics(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.auditLogService.getActionAnalytics({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('analytics/users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'security_manager', 'analyst')
  @ApiOperation({ summary: 'Get user activity analytics' })
  async getUserAnalytics(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.auditLogService.getUserAnalytics({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('threats/active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'security_manager')
  @ApiOperation({ summary: 'Get active security threats' })
  async getActiveThreats() {
    return this.auditLogService.getActiveThreats();
  }

  @Get('threats/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'security_manager')
  @ApiOperation({ summary: 'Get threat details' })
  async getThreatDetails(@Param('id') id: string) {
    return this.auditLogService.getThreatDetails(id);
  }

  @Post('threats/:id/acknowledge')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'security_manager')
  @ApiOperation({ summary: 'Acknowledge a security threat' })
  async acknowledgeThreat(
    @Param('id') id: string,
    @Body() body: { notes?: string },
    @Request() req: any,
  ) {
    return this.auditLogService.acknowledgeThreat(id, body.notes, req.user.id);
  }

  @Post('threats/:id/resolve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'security_manager')
  @ApiOperation({ summary: 'Resolve a security threat' })
  async resolveThreat(
    @Param('id') id: string,
    @Body() body: { resolution: string; notes?: string },
    @Request() req: any,
  ) {
    return this.auditLogService.resolveThreat(id, body.resolution, body.notes, req.user.id);
  }

  @Get('alerts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'security_manager')
  @ApiOperation({ summary: 'Get security alerts' })
  @ApiQuery({ name: 'severity', required: false, description: 'Filter by severity' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'from', required: false, description: 'From date' })
  @ApiQuery({ name: 'to', required: false, description: 'To date' })
  async getSecurityAlerts(
    @Query('severity') severity?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.auditLogService.getSecurityAlerts({
      severity,
      status,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Post('alerts/:id/acknowledge')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'security_manager')
  @ApiOperation({ summary: 'Acknowledge a security alert' })
  async acknowledgeAlert(
    @Param('id') id: string,
    @Body() body: { notes?: string },
    @Request() req: any,
  ) {
    return this.auditLogService.acknowledgeAlert(id, body.notes, req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'security_manager', 'auditor')
  @ApiOperation({ summary: 'Get a single audit log by ID' })
  @ApiResponse({ status: 200, description: 'Audit log found' })
  @ApiResponse({ status: 404, description: 'Audit log not found' })
  async findOne(@Param('id') id: string) {
    return this.auditLogService.findOne(id);
  }

  @Get(':id/details')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'security_manager')
  @ApiOperation({ summary: 'Get detailed audit log information' })
  async getAuditLogDetails(@Param('id') id: string) {
    return this.auditLogService.getAuditLogDetails(id);
  }

  @Get(':id/related')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'security_manager')
  @ApiOperation({ summary: 'Get related audit logs' })
  async getRelatedAuditLogs(@Param('id') id: string) {
    return this.auditLogService.getRelatedAuditLogs(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'security_manager')
  @ApiOperation({ summary: 'Create a new audit log' })
  @ApiBody({ type: CreateAuditLogDto })
  @ApiResponse({ status: 201, description: 'Audit log created' })
  async create(@Body() createDto: CreateAuditLogDto, @Request() req: any) {
    return this.auditLogService.create(createDto, req.user.id);
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'security_manager')
  @ApiOperation({ summary: 'Bulk create audit logs' })
  async bulkCreate(@Body() createDtos: CreateAuditLogDto[], @Request() req: any) {
    return this.auditLogService.bulkCreate(createDtos, req.user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'security_manager')
  @ApiOperation({ summary: 'Update an audit log' })
  @ApiBody({ type: UpdateAuditLogDto })
  @ApiResponse({ status: 200, description: 'Audit log updated' })
  @ApiResponse({ status: 404, description: 'Audit log not found' })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAuditLogDto,
    @Request() req: any,
  ) {
    return this.auditLogService.update(id, updateDto, req.user.id);
  }

  @Patch(':id/severity')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'security_manager')
  @ApiOperation({ summary: 'Update audit log severity' })
  async updateSeverity(
    @Param('id') id: string,
    @Body() body: { severity: string; reason?: string },
    @Request() req: any,
  ) {
    return this.auditLogService.updateSeverity(id, body.severity, body.reason, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete an audit log' })
  @ApiResponse({ status: 200, description: 'Audit log deleted' })
  @ApiResponse({ status: 404, description: 'Audit log not found' })
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.auditLogService.remove(id, req.user.id);
    return { message: 'Audit log deleted successfully' };
  }

  @Get('query')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'security_manager', 'auditor')
  @ApiOperation({ summary: 'Query audit logs with filters' })
  @ApiResponse({ status: 200, description: 'Filtered audit logs' })
  @ApiQuery({ name: 'userId', required: false, description: 'User ID' })
  @ApiQuery({ name: 'action', required: false, description: 'Action' })
  @ApiQuery({ name: 'entityType', required: false, description: 'Entity type' })
  @ApiQuery({ name: 'entityId', required: false, description: 'Entity ID' })
  @ApiQuery({ name: 'from', required: false, description: 'From date' })
  @ApiQuery({ name: 'to', required: false, description: 'To date' })
  @ApiQuery({ name: 'success', required: false, description: 'Success status' })
  @ApiQuery({ name: 'severity', required: false, description: 'Severity' })
  async findByQuery(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('success') success?: string,
    @Query('severity') severity?: string,
  ) {
    return this.auditLogService.findByQuery({
      userId,
      action,
      entityType,
      entityId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      success: success !== undefined ? success === 'true' : undefined,
      severity,
    });
  }

  @Get('compliance/gdpr')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'security_manager', 'compliance')
  @ApiOperation({ summary: 'Get GDPR compliance audit data' })
  async getGdprComplianceData(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.auditLogService.getGdprComplianceData({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('compliance/sox')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'security_manager', 'compliance')
  @ApiOperation({ summary: 'Get SOX compliance audit data' })
  async getSoxComplianceData(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.auditLogService.getSoxComplianceData({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('compliance/pci')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'security_manager', 'compliance')
  @ApiOperation({ summary: 'Get PCI compliance audit data' })
  async getPciComplianceData(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.auditLogService.getPciComplianceData({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('reports/security')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'security_manager', 'analyst')
  @ApiOperation({ summary: 'Generate security audit report' })
  async generateSecurityReport(
    @Res() res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('format') format: string = 'csv',
  ) {
    const data = await this.auditLogService.generateSecurityReport({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
    
    if (format === 'csv') {
      res.header('Content-Type', 'text/csv');
      res.attachment('security_audit_report.csv');
      return res.send(data);
    } else {
      res.header('Content-Type', 'application/json');
      return res.json(data);
    }
  }

  @Get('reports/compliance')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'security_manager', 'compliance')
  @ApiOperation({ summary: 'Generate compliance audit report' })
  async generateComplianceReport(
    @Res() res: Response,
    @Query('standard') standard: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('format') format: string = 'csv',
  ) {
    const data = await this.auditLogService.generateComplianceReport(standard, {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
    
    if (format === 'csv') {
      res.header('Content-Type', 'text/csv');
      res.attachment(`${standard}_compliance_report.csv`);
      return res.send(data);
    } else {
      res.header('Content-Type', 'application/json');
      return res.json(data);
    }
  }

  @Get('reports/threats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'security_manager', 'analyst')
  @ApiOperation({ summary: 'Generate threat analysis report' })
  async generateThreatReport(
    @Res() res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('format') format: string = 'csv',
  ) {
    const data = await this.auditLogService.generateThreatReport({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
    
    if (format === 'csv') {
      res.header('Content-Type', 'text/csv');
      res.attachment('threat_analysis_report.csv');
      return res.send(data);
    } else {
      res.header('Content-Type', 'application/json');
      return res.json(data);
    }
  }

  @Post('export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'security_manager', 'auditor')
  @ApiOperation({ summary: 'Export audit logs' })
  async exportAuditLogs(
    @Body() filters: any,
    @Res() res: Response,
    @Query('format') format: string = 'csv',
  ) {
    const data = await this.auditLogService.exportAuditLogs(filters, format);
    
    if (format === 'csv') {
      res.header('Content-Type', 'text/csv');
      res.attachment('audit_logs_export.csv');
      return res.send(data);
    } else {
      res.header('Content-Type', 'application/json');
      return res.json(data);
    }
  }

  @Post('retention/cleanup')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'security_manager')
  @ApiOperation({ summary: 'Clean up old audit logs based on retention policy' })
  async cleanupOldLogs(
    @Body() body: { olderThan: string; dryRun?: boolean },
    @Request() req: any,
  ) {
    return this.auditLogService.cleanupOldLogs(
      new Date(body.olderThan),
      body.dryRun || false,
      req.user.id,
    );
  }

  @Get('retention/policy')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'security_manager')
  @ApiOperation({ summary: 'Get audit log retention policy' })
  async getRetentionPolicy() {
    return this.auditLogService.getRetentionPolicy();
  }

  @Put('retention/policy')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'security_manager')
  @ApiOperation({ summary: 'Update audit log retention policy' })
  async updateRetentionPolicy(
    @Body() policy: any,
    @Request() req: any,
  ) {
    return this.auditLogService.updateRetentionPolicy(policy, req.user.id);
  }
}
