import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, DataSource } from 'typeorm';
import { Ticket } from '../ticketing/ticket.entity';
import { User } from '../users/user.entity';
import { Order } from '../payments/order.entity';
import { Event } from '../events/event.entity';
import { AccessControlLog } from '../ticketing/access-control-log.entity';
import { Refund } from '../payments/refund.entity';
import { AuditLog } from '../security/audit-log.entity';
import { Venue } from '../venues/venue.entity';
import { Seat } from '../venues/seat.entity';

export interface DashboardOverview {
  totalEvents: number;
  totalTickets: number;
  totalRevenue: number;
  totalUsers: number;
  activeEvents: number;
  pendingEvents: number;
  completedEvents: number;
  cancelledEvents: number;
  ticketSales: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  revenue: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  userGrowth: {
    newUsers: number;
    activeUsers: number;
    retentionRate: number;
  };
}

export interface RealTimeMetrics {
  activeUsers: number;
  currentEvents: number;
  ticketsSoldToday: number;
  revenueToday: number;
  systemHealth: {
    status: string;
    responseTime: number;
    uptime: number;
  };
}

export interface TicketSalesData {
  date: string;
  ticketsSold: number;
  revenue: number;
  events: number;
}

export interface SeatOccupancyData {
  zoneId: string;
  zoneName: string;
  totalSeats: number;
  occupiedSeats: number;
  occupancyRate: number;
}

export interface UserEngagementData {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
  averageSessionDuration: number;
  pageViews: number;
}

export interface RevenueData {
  period: string;
  revenue: number;
  tickets: number;
  averageTicketPrice: number;
  growth: number;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(AccessControlLog)
    private readonly accessLogRepository: Repository<AccessControlLog>,
    @InjectRepository(Refund)
    private readonly refundRepository: Repository<Refund>,
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
    @InjectRepository(Venue)
    private readonly venueRepository: Repository<Venue>,
    @InjectRepository(Seat)
    private readonly seatRepository: Repository<Seat>,
    private readonly dataSource: DataSource,
  ) {}

  async getDashboardOverview(filters?: { from?: Date; to?: Date; eventId?: string; venueId?: string }) {
    const summary = await this.getAdminDashboardSummary();
    const ticketSales = await this.getTicketSalesTimeSeries({
      eventId: filters?.eventId,
      from: filters?.from,
      to: filters?.to,
      interval: 'day'
    });
    const userEngagement = await this.getUserEngagementMetrics({
      from: filters?.from,
      to: filters?.to
    });

    return {
      summary,
      ticketSales,
      userEngagement,
      recentActivity: await this.getRecentActivity(10)
    };
  }

  async getRealTimeMetrics() {
    const now = new Date();
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const ticketsLastHour = await this.ticketRepository.count({
      where: { createdAt: MoreThanOrEqual(lastHour) }
    });

    const revenueLastHour = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'total')
      .where('order.createdAt >= :since', { since: lastHour })
      .andWhere('order.status IN (:...statuses)', { statuses: ['CONFIRMED', 'COMPLETED'] })
      .getRawOne();

    const activeUsers = await this.userRepository.count({
      where: { lastLogin: MoreThanOrEqual(last24Hours) }
    });

    return {
      ticketsLastHour,
      revenueLastHour: Number(revenueLastHour?.total) || 0,
      activeUsers,
      timestamp: now
    };
  }

  async getCustomDashboard(id: string, userId: string) {
    // This would fetch a user's custom dashboard configuration
    return {
      id,
      userId,
      name: 'Custom Dashboard',
      widgets: [
        { type: 'ticketSales', position: { x: 0, y: 0, w: 6, h: 4 } },
        { type: 'revenue', position: { x: 6, y: 0, w: 6, h: 4 } }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async createCustomDashboard(dashboard: any, userId: string) {
    // This would create a custom dashboard for the user
    return {
      id: 'dashboard-' + Date.now(),
      userId,
      name: dashboard.name,
      widgets: dashboard.widgets || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  async updateCustomDashboard(id: string, dashboard: any, userId: string) {
    // This would update a custom dashboard
    return {
      id,
      userId,
      name: dashboard.name,
      widgets: dashboard.widgets,
      updatedAt: new Date()
    };
  }

  async deleteCustomDashboard(id: string, userId: string) {
    // This would delete a custom dashboard
    return { success: true, message: 'Dashboard deleted successfully' };
  }

  async getTicketSalesTimeSeries({ eventId, from, to, interval }: {
    eventId?: string;
    from?: Date;
    to?: Date;
    interval: 'day' | 'week' | 'month';
  }) {
    let dateTrunc = 'day';
    if (interval === 'week') dateTrunc = 'week';
    if (interval === 'month') dateTrunc = 'month';
    const qb = this.ticketRepository
      .createQueryBuilder('ticket')
      .select(`DATE_TRUNC('${dateTrunc}', ticket.createdAt)`, 'period')
      .addSelect('COUNT(*)', 'ticketsSold')
      .addSelect('SUM(ticket.pricePaid)', 'totalRevenue');
    if (eventId) qb.andWhere('ticket.eventId = :eventId', { eventId });
    if (from) qb.andWhere('ticket.createdAt >= :from', { from });
    if (to) qb.andWhere('ticket.createdAt <= :to', { to });
    qb.groupBy('period').orderBy('period', 'ASC');
    return qb.getRawMany();
  }

  async getTicketSalesForecast(eventId: string, days: number = 30) {
    // Simple forecasting based on historical data
    const historicalData = await this.getTicketSalesTimeSeries({
      eventId,
      from: new Date(Date.now() - days * 2 * 24 * 60 * 60 * 1000),
      to: new Date(),
      interval: 'day'
    });

    // Calculate average daily sales
    const avgDailySales = historicalData.reduce((sum, day) => sum + Number(day.ticketsSold), 0) / historicalData.length;

    // Generate forecast
    const forecast = [];
    for (let i = 1; i <= days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      forecast.push({
        date: date.toISOString().split('T')[0],
        predictedSales: Math.round(avgDailySales * (1 + Math.random() * 0.2 - 0.1)), // Add some variance
        confidence: 0.8
      });
    }

    return forecast;
  }

  async getSeatOccupancyHeatmap({ eventId, venueId, granularity = 'seat' }: { eventId?: string; venueId?: string; granularity?: 'seat' | 'zone' }) {
    if (granularity === 'zone') {
      // Aggregate by zone
      const qb = this.ticketRepository.createQueryBuilder('ticket')
        .select('seat.zoneId', 'zoneId')
        .addSelect('COUNT(*)', 'count')
        .innerJoin('ticket.seat', 'seat')
        .where('ticket.bookingStatus = :status', { status: 'CONFIRMED' });
      if (eventId) qb.andWhere('ticket.eventId = :eventId', { eventId });
      if (venueId) qb.andWhere('seat.venueId = :venueId', { venueId });
      qb.groupBy('seat.zoneId');
      return qb.getRawMany();
    } else {
      // Default: aggregate by seat
      const qb = this.ticketRepository.createQueryBuilder('ticket')
        .select('ticket.seatId', 'seatId')
        .addSelect('COUNT(*)', 'count')
        .where('ticket.bookingStatus = :status', { status: 'CONFIRMED' })
        .andWhere('ticket.seatId IS NOT NULL');
      if (eventId) qb.andWhere('ticket.eventId = :eventId', { eventId });
      if (venueId) qb.andWhere('ticket.venueId = :venueId', { venueId });
      qb.groupBy('ticket.seatId');
      return qb.getRawMany();
    }
  }

  async getSeatOccupancyTrends(filters?: { venueId?: string; from?: Date; to?: Date; interval?: string }) {
    const qb = this.ticketRepository.createQueryBuilder('ticket')
      .select('DATE(ticket.createdAt)', 'date')
      .addSelect('COUNT(*)', 'occupiedSeats')
      .innerJoin('ticket.seat', 'seat')
      .where('ticket.bookingStatus = :status', { status: 'CONFIRMED' });

    if (filters?.venueId) {
      qb.andWhere('seat.venueId = :venueId', { venueId: filters.venueId });
    }
    if (filters?.from) {
      qb.andWhere('ticket.createdAt >= :from', { from: filters.from });
    }
    if (filters?.to) {
      qb.andWhere('ticket.createdAt <= :to', { to: filters.to });
    }

    qb.groupBy('DATE(ticket.createdAt)')
      .orderBy('date', 'ASC');

    return qb.getRawMany();
  }

  async getUserEngagementMetrics({ from, to }: { from?: Date; to?: Date }) {
    // Active users: users who purchased tickets in the range
    const qb = this.ticketRepository.createQueryBuilder('ticket')
      .select('ticket.userId', 'userId')
      .addSelect('COUNT(*)', 'ticketsPurchased');
    if (from) qb.andWhere('ticket.createdAt >= :from', { from });
    if (to) qb.andWhere('ticket.createdAt <= :to', { to });
    qb.groupBy('ticket.userId');
    const userStats = await qb.getRawMany();
    const activeUsers = userStats.length;
    const repeatBuyers = userStats.filter(u => Number(u.ticketsPurchased) > 1).length;
    const totalTickets = userStats.reduce((sum, u) => sum + Number(u.ticketsPurchased), 0);
    return {
      activeUsers,
      repeatBuyers,
      totalTickets,
      userStats,
    };
  }

  async getUserEngagementCohorts(filters?: { from?: Date; to?: Date; cohortType?: string }) {
    // Cohort analysis based on user registration date
    const qb = this.userRepository.createQueryBuilder('user')
      .select('DATE_TRUNC(\'month\', user.createdAt)', 'cohort')
      .addSelect('COUNT(DISTINCT user.id)', 'totalUsers')
      .addSelect('COUNT(DISTINCT ticket.userId)', 'activeUsers');

    if (filters?.from) {
      qb.andWhere('user.createdAt >= :from', { from: filters.from });
    }
    if (filters?.to) {
      qb.andWhere('user.createdAt <= :to', { to: filters.to });
    }

    qb.leftJoin('user.tickets', 'ticket')
      .groupBy('cohort')
      .orderBy('cohort', 'ASC');

    return qb.getRawMany();
  }

  async getRevenueOverview(filters?: { from?: Date; to?: Date; eventId?: string }) {
    const qb = this.orderRepository.createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'totalRevenue')
      .addSelect('COUNT(*)', 'totalOrders')
      .addSelect('AVG(order.totalAmount)', 'averageOrderValue')
      .where('order.status IN (:...statuses)', { statuses: ['CONFIRMED', 'COMPLETED'] });

    if (filters?.from) {
      qb.andWhere('order.createdAt >= :from', { from: filters.from });
    }
    if (filters?.to) {
      qb.andWhere('order.createdAt <= :to', { to: filters.to });
    }
    if (filters?.eventId) {
      qb.andWhere('order.eventId = :eventId', { eventId: filters.eventId });
    }

    const result = await qb.getRawOne();
    return {
      totalRevenue: Number(result.totalRevenue) || 0,
      totalOrders: Number(result.totalOrders) || 0,
      averageOrderValue: Number(result.averageOrderValue) || 0
    };
  }

  async getRevenueBreakdown(filters?: { from?: Date; to?: Date; groupBy?: string }) {
    const qb = this.orderRepository.createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'revenue')
      .addSelect('COUNT(*)', 'orders');

    if (filters?.groupBy === 'event') {
      qb.addSelect('order.eventId', 'group')
        .groupBy('order.eventId');
    } else if (filters?.groupBy === 'month') {
      qb.addSelect('DATE_TRUNC(\'month\', order.createdAt)', 'group')
        .groupBy('DATE_TRUNC(\'month\', order.createdAt)');
    } else {
      qb.addSelect('DATE(order.createdAt)', 'group')
        .groupBy('DATE(order.createdAt)');
    }

    if (filters?.from) {
      qb.andWhere('order.createdAt >= :from', { from: filters.from });
    }
    if (filters?.to) {
      qb.andWhere('order.createdAt <= :to', { to: filters.to });
    }

    qb.andWhere('order.status IN (:...statuses)', { statuses: ['CONFIRMED', 'COMPLETED'] })
      .orderBy('group', 'ASC');

    return qb.getRawMany();
  }

  async getEventPerformance(filters?: { from?: Date; to?: Date; limit?: number }) {
    const qb = this.eventRepository.createQueryBuilder('event')
      .select('event.id', 'eventId')
      .addSelect('event.name', 'eventName')
      .addSelect('COUNT(ticket.id)', 'ticketsSold')
      .addSelect('SUM(ticket.pricePaid)', 'revenue')
      .leftJoin('event.tickets', 'ticket')
      .groupBy('event.id, event.name');

    if (filters?.from) {
      qb.andWhere('event.startDate >= :from', { from: filters.from });
    }
    if (filters?.to) {
      qb.andWhere('event.startDate <= :to', { to: filters.to });
    }

    qb.orderBy('revenue', 'DESC');
    if (filters?.limit) {
      qb.limit(filters.limit);
    }

    return qb.getRawMany();
  }

  async getEventPopularity(limit: number = 10) {
    const qb = this.eventRepository.createQueryBuilder('event')
      .select('event.id', 'eventId')
      .addSelect('event.name', 'eventName')
      .addSelect('COUNT(ticket.id)', 'ticketsSold')
      .addSelect('AVG(ticket.pricePaid)', 'averagePrice')
      .leftJoin('event.tickets', 'ticket')
      .groupBy('event.id, event.name')
      .orderBy('ticketsSold', 'DESC')
      .limit(limit);

    return qb.getRawMany();
  }

  async getVenuePerformance(filters?: { from?: Date; to?: Date; venueId?: string }) {
    const qb = this.venueRepository.createQueryBuilder('venue')
      .select('venue.id', 'venueId')
      .addSelect('venue.name', 'venueName')
      .addSelect('COUNT(DISTINCT event.id)', 'eventsHosted')
      .addSelect('COUNT(ticket.id)', 'ticketsSold')
      .addSelect('SUM(ticket.pricePaid)', 'revenue')
      .leftJoin('venue.events', 'event')
      .leftJoin('event.tickets', 'ticket')
      .groupBy('venue.id, venue.name');

    if (filters?.from) {
      qb.andWhere('event.startDate >= :from', { from: filters.from });
    }
    if (filters?.to) {
      qb.andWhere('event.startDate <= :to', { to: filters.to });
    }
    if (filters?.venueId) {
      qb.andWhere('venue.id = :venueId', { venueId: filters.venueId });
    }

    qb.orderBy('revenue', 'DESC');
    return qb.getRawMany();
  }

  async getVenueUtilization(filters?: { venueId?: string; from?: Date; to?: Date }) {
    const qb = this.seatRepository.createQueryBuilder('seat')
      .select('venue.id', 'venueId')
      .addSelect('venue.name', 'venueName')
      .addSelect('COUNT(seat.id)', 'totalSeats')
      .addSelect('COUNT(ticket.id)', 'occupiedSeats')
      .addSelect('(COUNT(ticket.id) * 100.0 / COUNT(seat.id))', 'utilizationRate')
      .innerJoin('seat.venue', 'venue')
      .leftJoin('seat.tickets', 'ticket')
      .groupBy('venue.id, venue.name');

    if (filters?.venueId) {
      qb.andWhere('venue.id = :venueId', { venueId: filters.venueId });
    }
    if (filters?.from) {
      qb.andWhere('ticket.createdAt >= :from', { from: filters.from });
    }
    if (filters?.to) {
      qb.andWhere('ticket.createdAt <= :to', { to: filters.to });
    }

    return qb.getRawMany();
  }

  async getDetailedAdminSummary(filters?: { from?: Date; to?: Date }) {
    const summary = await this.getAdminDashboardSummary();
    const revenue = await this.getRevenueOverview(filters || {});
    const userEngagement = await this.getUserEngagementMetrics(filters || {});
    const eventPerformance = await this.getEventPerformance({ ...filters, limit: 5 });

    return {
      ...summary,
      revenue,
      userEngagement,
      topEvents: eventPerformance,
      systemHealth: await this.getSystemHealth()
    };
  }

  async getKPIs(filters?: { from?: Date; to?: Date }) {
    const summary = await this.getAdminDashboardSummary();
    const revenue = await this.getRevenueOverview(filters || {});
    const userEngagement = await this.getUserEngagementMetrics(filters || {});

    return {
      totalRevenue: revenue.totalRevenue,
      totalTickets: summary.totalTickets,
      activeUsers: userEngagement.activeUsers,
      averageOrderValue: revenue.averageOrderValue,
      repeatBuyerRate: summary.totalUsers > 0 ? (userEngagement.repeatBuyers / summary.totalUsers) * 100 : 0,
      ticketUtilizationRate: summary.totalTickets > 0 ? (summary.totalCheckIns / summary.totalTickets) * 100 : 0
    };
  }

  async getKPITrends(kpi: string, filters?: { from?: Date; to?: Date; interval?: string }) {
    const interval = filters?.interval || 'day';
    
    switch (kpi) {
      case 'revenue':
        return this.getRevenueBreakdown({ ...filters, groupBy: interval });
      case 'tickets':
        return this.getTicketSalesTimeSeries({ ...filters, interval: interval as any });
      case 'users':
        return this.getUserEngagementCohorts(filters);
      default:
        return [];
    }
  }

  async getAnalyticsAlerts(filters?: { severity?: string; status?: string }) {
    // This would fetch analytics alerts from a dedicated table
    return [
      {
        id: '1',
        type: 'LOW_REVENUE',
        severity: 'warning',
        status: 'active',
        message: 'Revenue is 20% below average for this period',
        createdAt: new Date()
      }
    ];
  }

  async createAnalyticsAlert(alert: any, userId: string) {
    // This would create an analytics alert
    return {
      id: 'alert-' + Date.now(),
      ...alert,
      createdBy: userId,
      createdAt: new Date()
    };
  }

  async updateAnalyticsAlert(id: string, alert: any, userId: string) {
    // This would update an analytics alert
    return {
      id,
      ...alert,
      updatedBy: userId,
      updatedAt: new Date()
    };
  }

  async deleteAnalyticsAlert(id: string, userId: string) {
    // This would delete an analytics alert
    return { success: true, message: 'Alert deleted successfully' };
  }

  async getRevenueReport(filters?: { from?: Date; to?: Date; groupBy?: string }) {
    return this.getRevenueBreakdown(filters);
  }

  async getEventsReport(filters?: { from?: Date; to?: Date; status?: string }) {
    const qb = this.eventRepository.createQueryBuilder('event')
      .select([
        'event.id',
        'event.name',
        'event.startDate',
        'event.endDate',
        'event.status',
        'event.capacity',
        'COUNT(ticket.id) as ticketsSold',
        'SUM(ticket.pricePaid) as revenue'
      ])
      .leftJoin('event.tickets', 'ticket')
      .groupBy('event.id, event.name, event.startDate, event.endDate, event.status, event.capacity');

    if (filters?.from) {
      qb.andWhere('event.startDate >= :from', { from: filters.from });
    }
    if (filters?.to) {
      qb.andWhere('event.startDate <= :to', { to: filters.to });
    }
    if (filters?.status) {
      qb.andWhere('event.status = :status', { status: filters.status });
    }

    qb.orderBy('event.startDate', 'DESC');
    return qb.getRawMany();
  }

  async getVenuesReport(filters?: { from?: Date; to?: Date; venueId?: string }) {
    return this.getVenuePerformance(filters);
  }

  async exportCustomData(query: string, format: string) {
    // This would execute custom analytics queries and export data
    return {
      query,
      format,
      data: [],
      exportedAt: new Date()
    };
  }

  async getInsights(category: string) {
    // This would provide AI-powered insights based on analytics data
    return {
      category,
      insights: [
        {
          type: 'trend',
          title: 'Revenue Growth',
          description: 'Revenue has increased by 15% compared to last month',
          confidence: 0.85
        }
      ],
      generatedAt: new Date()
    };
  }

  async generateInsights(params: any, userId: string) {
    // This would generate new insights based on parameters
    return {
      id: 'insight-' + Date.now(),
      params,
      generatedBy: userId,
      insights: await this.getInsights(params.category),
      createdAt: new Date()
    };
  }

  private async getRecentActivity(limit: number = 10) {
    const qb = this.auditLogRepository.createQueryBuilder('log')
      .select([
        'log.action',
        'log.entityType',
        'log.entityId',
        'log.userId',
        'log.createdAt'
      ])
      .orderBy('log.createdAt', 'DESC')
      .limit(limit);

    return qb.getMany();
  }

  private async getSystemHealth() {
    // This would check various system health metrics
    return {
      database: 'healthy',
      cache: 'healthy',
      externalServices: 'healthy',
      lastChecked: new Date()
    };
  }

  async getAdminDashboardSummary() {
    // Total tickets sold
    const totalTickets = await this.ticketRepository.count();
    // Total revenue (sum of order totalAmount for confirmed/completed orders)
    const { totalRevenue } = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'totalRevenue')
      .where('order.status IN (:...statuses)', { statuses: ['CONFIRMED', 'COMPLETED'] })
      .getRawOne();
    // Total events
    const totalEvents = await this.eventRepository.count();
    // Total users
    const totalUsers = await this.userRepository.count();
    // Active users (last 24h)
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeUsers = await this.userRepository
      .createQueryBuilder('user')
      .where('user.lastLogin >= :since', { since })
      .getCount();
    // Total check-ins (access control log, action ENTRY, status SUCCESS)
    const totalCheckIns = await this.accessLogRepository
      .createQueryBuilder('log')
      .where('log.action = :action', { action: 'ENTRY' })
      .andWhere('log.status = :status', { status: 'SUCCESS' })
      .getCount();
    return {
      totalTickets,
      totalRevenue: Number(totalRevenue) || 0,
      totalEvents,
      totalUsers,
      activeUsers,
      totalCheckIns,
    };
  }

  async getTicketSalesReport({ eventId, from, to }: { eventId?: string; from?: Date; to?: Date }) {
    const qb = this.ticketRepository.createQueryBuilder('ticket');
    if (eventId) qb.andWhere('ticket.eventId = :eventId', { eventId });
    if (from) qb.andWhere('ticket.createdAt >= :from', { from });
    if (to) qb.andWhere('ticket.createdAt <= :to', { to });
    qb.orderBy('ticket.createdAt', 'DESC');
    const tickets = await qb.getMany();
    // Map to plain objects for CSV
    return tickets.map(t => ({
      ticketNumber: t.ticketNumber,
      eventId: t.eventId,
      userId: t.userId,
      pricePaid: t.pricePaid,
      paymentStatus: t.paymentStatus,
      bookingStatus: t.bookingStatus,
      createdAt: t.createdAt,
    }));
  }

  async getOrdersReport({ from, to, eventId }: { from?: Date; to?: Date; eventId?: string }) {
    const qb = this.orderRepository.createQueryBuilder('order');
    if (from) qb.andWhere('order.createdAt >= :from', { from });
    if (to) qb.andWhere('order.createdAt <= :to', { to });
    if (eventId) qb.andWhere('order.eventId = :eventId', { eventId });
    qb.orderBy('order.createdAt', 'DESC');
    const orders = await qb.getMany();
    return orders.map(o => ({
      orderNumber: o.orderNumber,
      userId: o.userId,
      totalAmount: o.totalAmount,
      subtotalAmount: o.subtotalAmount,
      discountAmount: o.discountAmount,
      taxAmount: o.taxAmount,
      status: o.status,
      createdAt: o.createdAt,
    }));
  }

  async getRefundsReport({ from, to, userId }: { from?: Date; to?: Date; userId?: string }) {
    const qb = this.refundRepository.createQueryBuilder('refund');
    if (from) qb.andWhere('refund.createdAt >= :from', { from });
    if (to) qb.andWhere('refund.createdAt <= :to', { to });
    if (userId) qb.andWhere('refund.userId = :userId', { userId });
    qb.orderBy('refund.createdAt', 'DESC');
    const refunds = await qb.getMany();
    return refunds.map(r => ({
      refundNumber: r.refundNumber,
      userId: r.userId,
      amount: r.amount,
      currency: r.currency,
      status: r.status,
      reason: r.reason,
      createdAt: r.createdAt,
    }));
  }

  async getUserActivityReport({ from, to, userId }: { from?: Date; to?: Date; userId?: string }) {
    const qb = this.auditLogRepository.createQueryBuilder('log');
    if (from) qb.andWhere('log.createdAt >= :from', { from });
    if (to) qb.andWhere('log.createdAt <= :to', { to });
    if (userId) qb.andWhere('log.userId = :userId', { userId });
    qb.orderBy('log.createdAt', 'DESC');
    const logs = await qb.getMany();
    return logs.map(l => ({
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId,
      userId: l.userId,
      timestamp: l.createdAt
    }));
  }
} 