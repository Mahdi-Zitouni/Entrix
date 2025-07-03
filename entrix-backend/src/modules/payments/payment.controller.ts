import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
  Request,
  Res,
  Put,
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ApiOperation, ApiTags, ApiQuery, ApiResponse, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Response } from 'express';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'payment_manager', 'analyst')
  @ApiOperation({ summary: 'Get all payments with optional filtering' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by payment status' })
  @ApiQuery({ name: 'method', required: false, description: 'Filter by payment method' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'orderId', required: false, description: 'Filter by order ID' })
  @ApiQuery({ name: 'from', required: false, description: 'Filter from date' })
  @ApiQuery({ name: 'to', required: false, description: 'Filter to date' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  async findAll(
    @Query('status') status?: string,
    @Query('method') method?: string,
    @Query('userId') userId?: string,
    @Query('orderId') orderId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.paymentService.findAll({
      status,
      method,
      userId,
      orderId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      page: page || 1,
      limit: limit || 20,
    });
  }

  @Get('search')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'payment_manager')
  @ApiOperation({ summary: 'Advanced payment search' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'filters', required: false, description: 'JSON filters' })
  async searchPayments(
    @Query('q') query: string,
    @Query('filters') filters?: string,
  ) {
    const parsedFilters = filters ? JSON.parse(filters) : {};
    return this.paymentService.searchPayments(query, parsedFilters);
  }

  @Get('my-payments')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user payments' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'from', required: false, description: 'From date' })
  @ApiQuery({ name: 'to', required: false, description: 'To date' })
  async getMyPayments(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.paymentService.getUserPayments(req.user.id, {
      status,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('analytics/overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Get payment analytics overview' })
  @ApiQuery({ name: 'from', required: false, description: 'From date' })
  @ApiQuery({ name: 'to', required: false, description: 'To date' })
  async getAnalyticsOverview(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.paymentService.getAnalyticsOverview({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('analytics/revenue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Get payment revenue analytics' })
  @ApiQuery({ name: 'period', required: false, description: 'Period (day, week, month)' })
  @ApiQuery({ name: 'from', required: false, description: 'From date' })
  @ApiQuery({ name: 'to', required: false, description: 'To date' })
  async getRevenueAnalytics(
    @Query('period') period: string = 'month',
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.paymentService.getRevenueAnalytics(period, {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('analytics/methods')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Get payment methods analytics' })
  async getPaymentMethodsAnalytics(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.paymentService.getPaymentMethodsAnalytics({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('analytics/failures')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Get payment failure analytics' })
  async getFailureAnalytics(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.paymentService.getFailureAnalytics({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'payment_manager')
  @ApiOperation({ summary: 'Create a payment' })
  @ApiBody({ type: CreatePaymentDto })
  @ApiResponse({ status: 201, description: 'Payment created' })
  async create(@Body() dto: CreatePaymentDto, @Request() req: any) {
    return this.paymentService.create(dto, req.user.id);
  }

  @Post('/validate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'payment_manager')
  @ApiOperation({ summary: 'Validate a multi-currency payment request' })
  @ApiBody({ type: CreatePaymentDto })
  async validate(@Body() dto: CreatePaymentDto) {
    // Try to create, but catch currency mismatch error
    try {
      await this.paymentService.create(dto);
      return { valid: true };
    } catch (e: unknown) {
      let message = 'Unknown error';
      if (
        e &&
        typeof e === 'object' &&
        'message' in e &&
        typeof (e as { message?: unknown }).message === 'string'
      ) {
        message = (e as { message: string }).message;
      }
      return { valid: false, error: message };
    }
  }

  @Post('process')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'payment_manager')
  @ApiOperation({ summary: 'Process a payment' })
  async processPayment(
    @Body() body: { paymentId: string; method: string; details?: any },
    @Request() req: any,
  ) {
    return this.paymentService.processPayment(body.paymentId, body.method, body.details, req.user.id);
  }

  @Post('capture/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'payment_manager')
  @ApiOperation({ summary: 'Capture a payment' })
  async capturePayment(
    @Param('id') id: string,
    @Body() body: { amount?: number },
    @Request() req: any,
  ) {
    return this.paymentService.capturePayment(id, body.amount, req.user.id);
  }

  @Post('refund/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'payment_manager')
  @ApiOperation({ summary: 'Refund a payment' })
  async refundPayment(
    @Param('id') id: string,
    @Body() body: { amount?: number; reason: string },
    @Request() req: any,
  ) {
    return this.paymentService.refundPayment(id, body.reason, body.amount, req.user.id);
  }

  @Post('cancel/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'payment_manager')
  @ApiOperation({ summary: 'Cancel a payment' })
  async cancelPayment(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Request() req: any,
  ) {
    return this.paymentService.cancelPayment(id, body.reason, req.user.id);
  }

  @Post('webhook/:provider')
  @ApiOperation({ summary: 'Handle payment webhook' })
  async handleWebhook(
    @Param('provider') provider: string,
    @Body() payload: any,
    @Request() req: any,
  ) {
    return this.paymentService.handleWebhook(provider, payload, req.headers, req.ip);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'payment_manager', 'analyst')
  @ApiOperation({ summary: 'Get a payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment found' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async findOne(@Param('id') id: string) {
    return this.paymentService.findOne(id);
  }

  @Get(':id/details')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'payment_manager')
  @ApiOperation({ summary: 'Get detailed payment information' })
  async getPaymentDetails(@Param('id') id: string) {
    return this.paymentService.getPaymentDetails(id);
  }

  @Get(':id/history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'payment_manager')
  @ApiOperation({ summary: 'Get payment history' })
  async getPaymentHistory(@Param('id') id: string) {
    return this.paymentService.getPaymentHistory(id);
  }

  @Get(':id/refunds')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'payment_manager')
  @ApiOperation({ summary: 'Get payment refunds' })
  async getPaymentRefunds(@Param('id') id: string) {
    return this.paymentService.getPaymentRefunds(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'payment_manager')
  @ApiOperation({ summary: 'Update a payment' })
  @ApiBody({ type: CreatePaymentDto })
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreatePaymentDto>,
    @Request() req: any,
  ) {
    return this.paymentService.update(id, dto, req.user.id);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'payment_manager')
  @ApiOperation({ summary: 'Update payment status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; reason?: string },
    @Request() req: any,
  ) {
    return this.paymentService.updateStatus(id, body.status, body.reason, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a payment' })
  async remove(@Param('id') id: string, @Request() req: any) {
    return this.paymentService.remove(id, req.user.id);
  }

  @Get('methods/available')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get available payment methods' })
  async getAvailableMethods(@Request() req: any) {
    return this.paymentService.getAvailableMethods(req.user.id);
  }

  @Get('methods/supported')
  @ApiOperation({ summary: 'Get supported payment methods' })
  async getSupportedMethods() {
    return this.paymentService.getSupportedMethods();
  }

  @Post('methods/test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'payment_manager')
  @ApiOperation({ summary: 'Test payment method configuration' })
  async testPaymentMethod(
    @Body() body: { method: string; config: any },
    @Request() req: any,
  ) {
    return this.paymentService.testPaymentMethod(body.method, body.config, req.user.id);
  }

  @Get('refunds/search')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'payment_manager')
  @ApiOperation({ summary: 'Search refunds' })
  @ApiQuery({ name: 'status', required: false, description: 'Refund status' })
  @ApiQuery({ name: 'paymentId', required: false, description: 'Payment ID' })
  @ApiQuery({ name: 'userId', required: false, description: 'User ID' })
  @ApiQuery({ name: 'from', required: false, description: 'From date' })
  @ApiQuery({ name: 'to', required: false, description: 'To date' })
  async searchRefunds(
    @Query('status') status?: string,
    @Query('paymentId') paymentId?: string,
    @Query('userId') userId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.paymentService.searchRefunds({
      status,
      paymentId,
      userId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('webhooks/logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'payment_manager')
  @ApiOperation({ summary: 'Get webhook logs' })
  @ApiQuery({ name: 'provider', required: false, description: 'Payment provider' })
  @ApiQuery({ name: 'status', required: false, description: 'Webhook status' })
  @ApiQuery({ name: 'from', required: false, description: 'From date' })
  @ApiQuery({ name: 'to', required: false, description: 'To date' })
  async getWebhookLogs(
    @Query('provider') provider?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.paymentService.getWebhookLogs({
      provider,
      status,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Post('webhooks/retry/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'payment_manager')
  @ApiOperation({ summary: 'Retry failed webhook' })
  async retryWebhook(@Param('id') id: string, @Request() req: any) {
    return this.paymentService.retryWebhook(id, req.user.id);
  }

  @Get('reports/revenue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Generate revenue report' })
  async generateRevenueReport(
    @Res() res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('format') format: string = 'csv',
  ) {
    const data = await this.paymentService.generateRevenueReport({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
    
    if (format === 'csv') {
      res.header('Content-Type', 'text/csv');
      res.attachment('revenue_report.csv');
      return res.send(data);
    } else {
      res.header('Content-Type', 'application/json');
      return res.json(data);
    }
  }

  @Get('reports/refunds')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Generate refunds report' })
  async generateRefundsReport(
    @Res() res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('format') format: string = 'csv',
  ) {
    const data = await this.paymentService.generateRefundsReport({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
    
    if (format === 'csv') {
      res.header('Content-Type', 'text/csv');
      res.attachment('refunds_report.csv');
      return res.send(data);
    } else {
      res.header('Content-Type', 'application/json');
      return res.json(data);
    }
  }

  @Get('reports/failures')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'analyst')
  @ApiOperation({ summary: 'Generate payment failures report' })
  async generateFailuresReport(
    @Res() res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('format') format: string = 'csv',
  ) {
    const data = await this.paymentService.generateFailuresReport({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
    
    if (format === 'csv') {
      res.header('Content-Type', 'text/csv');
      res.attachment('payment_failures_report.csv');
      return res.send(data);
    } else {
      res.header('Content-Type', 'application/json');
      return res.json(data);
    }
  }

  @Get('reconciliation')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'payment_manager')
  @ApiOperation({ summary: 'Get payment reconciliation data' })
  async getReconciliationData(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('provider') provider?: string,
  ) {
    return this.paymentService.getReconciliationData({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      provider,
    });
  }

  @Post('reconciliation/process')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'payment_manager')
  @ApiOperation({ summary: 'Process payment reconciliation' })
  async processReconciliation(
    @Body() body: { from: string; to: string; provider?: string },
    @Request() req: any,
  ) {
    return this.paymentService.processReconciliation(
      new Date(body.from),
      new Date(body.to),
      body.provider,
      req.user.id,
    );
  }
}
