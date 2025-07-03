import { 
  Controller, 
  Get, 
  Query, 
  Res, 
  UseGuards, 
  Request, 
  Post, 
  Body, 
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { Parser as Json2CsvParser } from 'json2csv';
import { Response } from 'express';
import { ApiOperation, ApiTags, ApiQuery, ApiResponse, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard/overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst', 'manager')
  @ApiOperation({ summary: 'Get dashboard overview metrics' })
  @ApiQuery({ name: 'from', required: false, description: 'From date' })
  @ApiQuery({ name: 'to', required: false, description: 'To date' })
  async getDashboardOverview(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getDashboardOverview({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('dashboard/realtime')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Get real-time dashboard metrics' })
  async getRealTimeMetrics() {
    return this.analyticsService.getRealTimeMetrics();
  }

  @Get('dashboard/custom/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst', 'manager')
  @ApiOperation({ summary: 'Get custom dashboard by ID' })
  async getCustomDashboard(@Param('id') id: string, @Request() req: any) {
    if (!id) throw new Error('Dashboard ID is required');
    return this.analyticsService.getCustomDashboard(id, req.user.id);
  }

  @Post('dashboard/custom')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst', 'manager')
  @ApiOperation({ summary: 'Create custom dashboard' })
  async createCustomDashboard(
    @Body() dashboard: any,
    @Request() req: any,
  ) {
    return this.analyticsService.createCustomDashboard(dashboard, req.user.id);
  }

  @Put('dashboard/custom/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst', 'manager')
  @ApiOperation({ summary: 'Update custom dashboard' })
  async updateCustomDashboard(
    @Param('id') id: string,
    @Body() dashboard: any,
    @Request() req: any,
  ) {
    return this.analyticsService.updateCustomDashboard(id, dashboard, req.user.id);
  }

  @Delete('dashboard/custom/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Delete custom dashboard' })
  async deleteCustomDashboard(@Param('id') id: string, @Request() req: any) {
    return this.analyticsService.deleteCustomDashboard(id, req.user.id);
  }

  @Get('ticket-sales')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Get ticket sales analytics' })
  @ApiQuery({ name: 'eventId', required: false, description: 'Event ID' })
  @ApiQuery({ name: 'from', required: false, description: 'From date' })
  @ApiQuery({ name: 'to', required: false, description: 'To date' })
  @ApiQuery({ name: 'interval', required: false, description: 'Time interval' })
  async getTicketSales(
    @Query('eventId') eventId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('interval') interval: 'day' | 'week' | 'month' = 'day',
  ) {
    return this.analyticsService.getTicketSalesTimeSeries({
      eventId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      interval,
    });
  }

  @Get('ticket-sales/forecast')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Get ticket sales forecast' })
  @ApiQuery({ name: 'eventId', required: false, description: 'Event ID' })
  @ApiQuery({ name: 'days', required: false, description: 'Forecast days' })
  async getTicketSalesForecast(
    @Query('eventId') eventId?: string,
    @Query('days') days: number = 30,
  ) {
    return this.analyticsService.getTicketSalesForecast(eventId || '', days);
  }

  @Get('seat-occupancy')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Get seat occupancy analytics' })
  @ApiQuery({ name: 'eventId', required: false, description: 'Event ID' })
  @ApiQuery({ name: 'venueId', required: false, description: 'Venue ID' })
  async getSeatOccupancy(
    @Query('eventId') eventId?: string,
    @Query('venueId') venueId?: string,
  ) {
    return this.analyticsService.getSeatOccupancyHeatmap({ eventId, venueId });
  }

  @Get('seat-occupancy/trends')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Get seat occupancy trends' })
  @ApiQuery({ name: 'venueId', required: false, description: 'Venue ID' })
  @ApiQuery({ name: 'from', required: false, description: 'From date' })
  @ApiQuery({ name: 'to', required: false, description: 'To date' })
  async getSeatOccupancyTrends(
    @Query('venueId') venueId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getSeatOccupancyTrends({
      venueId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('user-engagement')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Get user engagement analytics' })
  @ApiQuery({ name: 'from', required: false, description: 'From date' })
  @ApiQuery({ name: 'to', required: false, description: 'To date' })
  async getUserEngagement(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getUserEngagementMetrics({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('user-engagement/cohorts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Get user engagement cohort analysis' })
  async getUserEngagementCohorts(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getUserEngagementCohorts({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('revenue/overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Get revenue overview analytics' })
  @ApiQuery({ name: 'from', required: false, description: 'From date' })
  @ApiQuery({ name: 'to', required: false, description: 'To date' })
  async getRevenueOverview(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getRevenueOverview({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('revenue/breakdown')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Get revenue breakdown by category' })
  @ApiQuery({ name: 'from', required: false, description: 'From date' })
  @ApiQuery({ name: 'to', required: false, description: 'To date' })
  async getRevenueBreakdown(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getRevenueBreakdown({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('events/performance')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Get event performance analytics' })
  @ApiQuery({ name: 'from', required: false, description: 'From date' })
  @ApiQuery({ name: 'to', required: false, description: 'To date' })
  async getEventPerformance(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getEventPerformance({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('events/popularity')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Get event popularity analytics' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of events' })
  async getEventPopularity(@Query('limit') limit: number = 10) {
    return this.analyticsService.getEventPopularity(limit);
  }

  @Get('venues/performance')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Get venue performance analytics' })
  @ApiQuery({ name: 'from', required: false, description: 'From date' })
  @ApiQuery({ name: 'to', required: false, description: 'To date' })
  async getVenuePerformance(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getVenuePerformance({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('venues/utilization')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Get venue utilization analytics' })
  @ApiQuery({ name: 'from', required: false, description: 'From date' })
  @ApiQuery({ name: 'to', required: false, description: 'To date' })
  async getVenueUtilization(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getVenueUtilization({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('admin-summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Get admin dashboard summary' })
  async getAdminDashboardSummary() {
    return this.analyticsService.getAdminDashboardSummary();
  }

  @Get('admin-summary/detailed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Get detailed admin dashboard summary' })
  @ApiQuery({ name: 'from', required: false, description: 'From date' })
  @ApiQuery({ name: 'to', required: false, description: 'To date' })
  async getDetailedAdminSummary(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getDetailedAdminSummary({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('kpis')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst', 'manager')
  @ApiOperation({ summary: 'Get key performance indicators' })
  @ApiQuery({ name: 'from', required: false, description: 'From date' })
  @ApiQuery({ name: 'to', required: false, description: 'To date' })
  async getKPIs(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getKPIs({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('kpis/trends')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Get KPI trends over time' })
  @ApiQuery({ name: 'kpi', required: true, description: 'KPI name' })
  @ApiQuery({ name: 'from', required: false, description: 'From date' })
  @ApiQuery({ name: 'to', required: false, description: 'To date' })
  async getKPITrends(
    @Query('kpi') kpi: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.analyticsService.getKPITrends(kpi, {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('alerts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Get analytics alerts' })
  @ApiQuery({ name: 'severity', required: false, description: 'Alert severity' })
  @ApiQuery({ name: 'status', required: false, description: 'Alert status' })
  async getAnalyticsAlerts(
    @Query('severity') severity?: string,
    @Query('status') status?: string,
  ) {
    return this.analyticsService.getAnalyticsAlerts({ severity, status });
  }

  @Post('alerts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Create analytics alert' })
  async createAnalyticsAlert(
    @Body() alert: any,
    @Request() req: any,
  ) {
    return this.analyticsService.createAnalyticsAlert(alert, req.user.id);
  }

  @Put('alerts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Update analytics alert' })
  async updateAnalyticsAlert(
    @Param('id') id: string,
    @Body() alert: any,
    @Request() req: any,
  ) {
    return this.analyticsService.updateAnalyticsAlert(id, alert, req.user.id);
  }

  @Delete('alerts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Delete analytics alert' })
  async deleteAnalyticsAlert(@Param('id') id: string, @Request() req: any) {
    return this.analyticsService.deleteAnalyticsAlert(id, req.user.id);
  }

  @Get('reports/ticket-sales')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Generate ticket sales report' })
  async getTicketSalesReport(
    @Res() res: Response,
    @Query('eventId') eventId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('format') format: string = 'csv',
  ) {
    const data = await this.analyticsService.getTicketSalesReport({
      eventId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
    
    if (format === 'csv') {
      const parser = new Json2CsvParser();
      const csv = parser.parse(data);
      res.header('Content-Type', 'text/csv');
      res.attachment('ticket_sales_report.csv');
      return res.send(csv);
    } else {
      res.header('Content-Type', 'application/json');
      return res.json(data);
    }
  }

  @Get('reports/orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Generate orders report' })
  async getOrdersReport(
    @Res() res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('eventId') eventId?: string,
    @Query('format') format: string = 'csv',
  ) {
    const data = await this.analyticsService.getOrdersReport({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      eventId,
    });
    
    if (format === 'csv') {
      const parser = new Json2CsvParser();
      const csv = parser.parse(data);
      res.header('Content-Type', 'text/csv');
      res.attachment('orders_report.csv');
      return res.send(csv);
    } else {
      res.header('Content-Type', 'application/json');
      return res.json(data);
    }
  }

  @Get('reports/refunds')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Generate refunds report' })
  async getRefundsReport(
    @Res() res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('userId') userId?: string,
    @Query('format') format: string = 'csv',
  ) {
    const data = await this.analyticsService.getRefundsReport({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      userId,
    });
    
    if (format === 'csv') {
      const parser = new Json2CsvParser();
      const csv = parser.parse(data);
      res.header('Content-Type', 'text/csv');
      res.attachment('refunds_report.csv');
      return res.send(csv);
    } else {
      res.header('Content-Type', 'application/json');
      return res.json(data);
    }
  }

  @Get('reports/user-activity')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Generate user activity report' })
  async getUserActivityReport(
    @Res() res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('userId') userId?: string,
    @Query('format') format: string = 'csv',
  ) {
    const data = await this.analyticsService.getUserActivityReport({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      userId,
    });
    
    if (format === 'csv') {
      const parser = new Json2CsvParser();
      const csv = parser.parse(data);
      res.header('Content-Type', 'text/csv');
      res.attachment('user_activity_report.csv');
      return res.send(csv);
    } else {
      res.header('Content-Type', 'application/json');
      return res.json(data);
    }
  }

  @Get('revenue/report')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Export revenue report' })
  @ApiQuery({ name: 'from', required: false, description: 'From date' })
  @ApiQuery({ name: 'to', required: false, description: 'To date' })
  @ApiQuery({ name: 'groupBy', required: false, description: 'Group by period' })
  @ApiQuery({ name: 'format', required: false, description: 'Export format' })
  async getRevenueReport(
    @Res() res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('groupBy') groupBy: string = 'month',
    @Query('format') format: string = 'csv',
  ) {
    const data = await this.analyticsService.getRevenueReport({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      groupBy,
    });
    
    if (format === 'csv') {
      const parser = new Json2CsvParser();
      const csv = parser.parse(data);
      res.header('Content-Type', 'text/csv');
      res.attachment('revenue_report.csv');
      return res.send(csv);
    } else {
      res.header('Content-Type', 'application/json');
      return res.json(data);
    }
  }

  @Get('reports/events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Generate events performance report' })
  async getEventsReport(
    @Res() res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('format') format: string = 'csv',
  ) {
    const data = await this.analyticsService.getEventsReport({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
    
    if (format === 'csv') {
      const parser = new Json2CsvParser();
      const csv = parser.parse(data);
      res.header('Content-Type', 'text/csv');
      res.attachment('events_report.csv');
      return res.send(csv);
    } else {
      res.header('Content-Type', 'application/json');
      return res.json(data);
    }
  }

  @Get('reports/venues')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Generate venues performance report' })
  async getVenuesReport(
    @Res() res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('format') format: string = 'csv',
  ) {
    const data = await this.analyticsService.getVenuesReport({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
    
    if (format === 'csv') {
      const parser = new Json2CsvParser();
      const csv = parser.parse(data);
      res.header('Content-Type', 'text/csv');
      res.attachment('venues_report.csv');
      return res.send(csv);
    } else {
      res.header('Content-Type', 'application/json');
      return res.json(data);
    }
  }

  @Post('export/custom')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Export custom analytics data' })
  async exportCustomData(
    @Body() query: any,
    @Res() res: Response,
    @Query('format') format: string = 'csv',
  ) {
    const data = await this.analyticsService.exportCustomData(query, format);
    
    if (format === 'csv') {
      const parser = new Json2CsvParser();
      const csv = parser.parse(data);
      res.header('Content-Type', 'text/csv');
      res.attachment('custom_analytics_export.csv');
      return res.send(csv);
    } else {
      res.header('Content-Type', 'application/json');
      return res.json(data);
    }
  }

  @Get('insights')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Get analytics insights' })
  @ApiQuery({ name: 'category', required: false, description: 'Insight category' })
  async getInsights(@Query('category') category?: string) {
    if (!category) category = 'general';
    return this.analyticsService.getInsights(category);
  }

  @Post('insights/generate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Generate new insights' })
  async generateInsights(
    @Body() params: any,
    @Request() req: any,
  ) {
    return this.analyticsService.generateInsights(params, req.user.id);
  }
} 