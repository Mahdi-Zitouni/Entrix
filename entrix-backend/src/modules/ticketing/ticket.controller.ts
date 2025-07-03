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
  Patch,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { TicketService } from './ticket.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { ApiOperation, ApiTags, ApiQuery, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Tickets')
@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ticket_manager', 'badge_checker')
  @ApiOperation({ summary: 'Get all tickets with optional filtering' })
  @ApiQuery({ name: 'eventId', required: false, description: 'Filter by event ID' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by ticket status' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by ticket type' })
  @ApiQuery({ name: 'from', required: false, description: 'Filter from date' })
  @ApiQuery({ name: 'to', required: false, description: 'Filter to date' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  async findAll(
    @Query('eventId') eventId?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.ticketService.findAll({
      eventId,
      userId,
      status,
      type,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      page: page || 1,
      limit: limit || 20,
    });
  }

  @Get('search')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ticket_manager')
  @ApiOperation({ summary: 'Advanced ticket search' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiQuery({ name: 'filters', required: false, description: 'JSON filters' })
  async searchTickets(
    @Query('q') query: string,
    @Query('filters') filters?: string,
  ) {
    const parsedFilters = filters ? JSON.parse(filters) : {};
    return this.ticketService.searchTickets(query, parsedFilters);
  }

  @Get('my-tickets')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user tickets' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'eventId', required: false, description: 'Filter by event' })
  async getMyTickets(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('eventId') eventId?: string,
  ) {
    return this.ticketService.getUserTickets(req.user.id, { status, eventId });
  }

  @Get('validation/:ticketId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'badge_checker')
  @ApiOperation({ summary: 'Validate ticket for entry' })
  async validateTicket(
    @Param('ticketId') ticketId: string,
    @Request() req: any,
    @Query('accessPoint') accessPoint?: string,
  ) {
    return this.ticketService.validateTicket(ticketId, accessPoint, req.user.id);
  }

  @Post('validation/bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'badge_checker')
  @ApiOperation({ summary: 'Bulk validate tickets' })
  async bulkValidateTickets(
    @Body() body: { ticketIds: string[]; accessPoint?: string },
    @Request() req: any,
  ) {
    return this.ticketService.bulkValidateTickets(body.ticketIds, body.accessPoint, req.user.id);
  }

  @Get('analytics/sales')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'analyst')
  @ApiOperation({ summary: 'Get ticket sales analytics by event/date' })
  @ApiQuery({ name: 'eventId', required: false, description: 'Event ID' })
  @ApiQuery({ name: 'from', required: false, description: 'From date' })
  @ApiQuery({ name: 'to', required: false, description: 'To date' })
  @ApiQuery({ name: 'groupBy', required: false, description: 'Group by (day, week, month)' })
  async getSalesAnalytics(
    @Query('eventId') eventId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('groupBy') groupBy?: string,
  ) {
    return this.ticketService.getSalesByEventAndDate({
      eventId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      groupBy: groupBy || 'day',
    });
  }

  @Get('analytics/performance')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'analyst')
  @ApiOperation({ summary: 'Get ticket performance analytics' })
  async getPerformanceAnalytics(
    @Query('eventId') eventId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.ticketService.getPerformanceAnalytics({
      eventId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('analytics/transfers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'analyst')
  @ApiOperation({ summary: 'Get ticket transfer analytics' })
  async getTransferAnalytics(
    @Query('eventId') eventId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.ticketService.getTransferAnalytics({
      eventId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ticket_manager', 'badge_checker')
  @ApiOperation({ summary: 'Get ticket by ID' })
  @ApiResponse({ status: 200, description: 'Ticket found' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async findOne(@Param('id') id: string) {
    return this.ticketService.findOne(id);
  }

  @Get(':id/details')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get detailed ticket information' })
  async getTicketDetails(@Param('id') id: string, @Request() req: any) {
    return this.ticketService.getTicketDetails(id, req.user.id);
  }

  @Get(':id/access-rights')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get ticket access rights' })
  async getTicketAccessRights(@Param('id') id: string, @Request() req: any) {
    return this.ticketService.getTicketAccessRights(id, req.user.id);
  }

  @Get(':id/usage-history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ticket_manager')
  @ApiOperation({ summary: 'Get ticket usage history' })
  async getTicketUsageHistory(@Param('id') id: string) {
    return this.ticketService.getTicketUsageHistory(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ticket_manager')
  @ApiOperation({ summary: 'Create new ticket' })
  @ApiBody({ type: CreateTicketDto })
  @ApiResponse({ status: 201, description: 'Ticket created' })
  async create(@Body() createDto: CreateTicketDto, @Request() req: any) {
    return this.ticketService.create(createDto, req.user.id);
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ticket_manager')
  @ApiOperation({ summary: 'Bulk create tickets' })
  async bulkCreate(@Body() createDtos: CreateTicketDto[], @Request() req: any) {
    return this.ticketService.bulkCreate(createDtos, req.user.id);
  }

  @Post('import')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ticket_manager')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Import tickets from file' })
  async importTickets(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    return this.ticketService.importTickets(file, req.user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ticket_manager')
  @ApiOperation({ summary: 'Update ticket' })
  @ApiBody({ type: UpdateTicketDto })
  async update(@Param('id') id: string, @Body() updateDto: UpdateTicketDto, @Request() req: any) {
    return this.ticketService.update(id, updateDto, req.user.id);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ticket_manager', 'badge_checker')
  @ApiOperation({ summary: 'Update ticket status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; reason?: string },
    @Request() req: any,
  ) {
    return this.ticketService.updateStatus(id, body.status, body.reason, req.user.id);
  }

  @Put(':id/pricing')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ticket_manager')
  @ApiOperation({ summary: 'Update ticket pricing' })
  async updatePricing(
    @Param('id') id: string,
    @Body() pricingData: any,
    @Request() req: any,
  ) {
    return this.ticketService.updatePricing(id, pricingData, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete ticket' })
  async remove(@Param('id') id: string, @Request() req: any) {
    await this.ticketService.remove(id, req.user.id);
    return { message: 'Ticket deleted successfully' };
  }

  @Post(':id/list-for-transfer')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List ticket for transfer' })
  async listForTransfer(
    @Param('id') id: string,
    @Body() body: { sellerId: string; price: number; commission: number },
    @Request() req: any,
  ) {
    return this.ticketService.listForTransfer(
      id,
      body.sellerId,
      body.price,
      body.commission,
    );
  }

  @Post('/ticket-transfers/:id/claim')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Claim ticket transfer' })
  async claimTransfer(
    @Param('id') id: string,
    @Body() body: { buyerId: string },
    @Request() req: any,
  ) {
    return this.ticketService.claimTransfer(id, body.buyerId, req.user.id);
  }

  @Post('/ticket-transfers/:id/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ticket_manager')
  @ApiOperation({ summary: 'Complete ticket transfer' })
  async completeTransfer(@Param('id') id: string, @Request() req: any) {
    return this.ticketService.completeTransfer(id, req.user.id);
  }

  @Post('/ticket-transfers/:id/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cancel ticket transfer' })
  async cancelTransfer(@Param('id') id: string, @Request() req: any) {
    return this.ticketService.cancelTransfer(id, req.user.id);
  }

  @Get(':id/qrcode')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get QR code for a ticket (data URL)' })
  async getTicketQrCode(@Param('id') id: string, @Request() req: any) {
    return this.ticketService.generateTicketQrCode(id, req.user.id);
  }

  @Get(':id/barcode')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get barcode for a ticket (data URL)' })
  async getTicketBarcode(@Param('id') id: string, @Request() req: any) {
    return this.ticketService.generateTicketBarcode(id, req.user.id);
  }

  @Get(':id/transfers')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get ticket transfer history' })
  async getTransferHistory(@Param('id') id: string, @Request() req: any) {
    return this.ticketService.getTransferHistory(id, req.user.id);
  }

  @Get(':id/download')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Download ticket as PDF' })
  async downloadTicket(@Param('id') id: string, @Res() res: Response, @Request() req: any) {
    const pdfBuffer = await this.ticketService.generateTicketPdf(id, req.user.id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="ticket-${id}.pdf"`,
    });
    res.end(pdfBuffer);
  }

  @Post('bulk-assign')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ticket_manager')
  @ApiOperation({ summary: 'Bulk assign tickets to user' })
  async bulkAssign(
    @Body() body: { ticketIds: string[]; userId: string },
    @Request() req: any,
  ) {
    return this.ticketService.bulkAssign(body.ticketIds, body.userId, req.user.id);
  }

  @Post('bulk-revoke')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ticket_manager')
  @ApiOperation({ summary: 'Bulk revoke tickets' })
  async bulkRevoke(@Body() body: { ticketIds: string[] }, @Request() req: any) {
    return this.ticketService.bulkRevoke(body.ticketIds, req.user.id);
  }

  @Post('bulk-export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ticket_manager')
  @ApiOperation({ summary: 'Bulk export tickets' })
  async bulkExport(
    @Body() filters: any,
    @Res() res: Response,
    @Query('format') format: string = 'csv',
  ) {
    const data = await this.ticketService.bulkExport(filters, format);
    if (format === 'csv') {
      res.header('Content-Type', 'text/csv');
      res.attachment('tickets_export.csv');
      return res.send(data);
    } else {
      res.header('Content-Type', 'application/json');
      return res.json(data);
    }
  }

  @Get('transfers/search')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ticket_manager')
  @ApiOperation({ summary: 'Search ticket transfers' })
  @ApiQuery({ name: 'status', required: false, description: 'Transfer status' })
  @ApiQuery({ name: 'eventId', required: false, description: 'Event ID' })
  @ApiQuery({ name: 'sellerId', required: false, description: 'Seller ID' })
  @ApiQuery({ name: 'buyerId', required: false, description: 'Buyer ID' })
  @ApiQuery({ name: 'from', required: false, description: 'From date' })
  @ApiQuery({ name: 'to', required: false, description: 'To date' })
  async searchTransfers(
    @Query('status') status?: string,
    @Query('eventId') eventId?: string,
    @Query('sellerId') sellerId?: string,
    @Query('buyerId') buyerId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.ticketService.findTransfersByQuery({
      status,
      eventId,
      sellerId,
      buyerId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Patch('transfers/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ticket_manager')
  @ApiOperation({ summary: 'Approve ticket transfer' })
  async approveTransfer(@Param('id') id: string, @Request() req: any) {
    return this.ticketService.approveTransfer(id, req.user.id);
  }

  @Patch('transfers/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ticket_manager')
  @ApiOperation({ summary: 'Reject ticket transfer' })
  async rejectTransfer(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @Request() req: any,
  ) {
    return this.ticketService.rejectTransfer(id, body.reason, req.user.id);
  }

  @Post(':id/refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ticket_manager')
  @ApiOperation({ summary: 'Request ticket refund' })
  async requestRefund(
    @Param('id') id: string,
    @Body() body: { reason: string; amount?: number },
    @Request() req: any,
  ) {
    return this.ticketService.requestRefund(id, body.reason, body.amount, req.user.id);
  }

  @Get(':id/refund-eligibility')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Check ticket refund eligibility' })
  async checkRefundEligibility(@Param('id') id: string, @Request() req: any) {
    return this.ticketService.checkRefundEligibility(id, req.user.id);
  }

  @Post(':id/access-log')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'badge_checker')
  @ApiOperation({ summary: 'Log ticket access attempt' })
  async logAccessAttempt(
    @Param('id') id: string,
    @Body() body: { accessPoint: string; success: boolean; reason?: string },
    @Request() req: any,
  ) {
    return this.ticketService.logAccessAttempt(id, body, req.user.id);
  }

  @Get('reports/sales')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'analyst')
  @ApiOperation({ summary: 'Generate ticket sales report' })
  async generateSalesReport(
    @Res() res: Response,
    @Query('eventId') eventId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('format') format: string = 'csv',
  ) {
    const data = await this.ticketService.generateSalesReport({
      eventId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
    
    if (format === 'csv') {
      res.header('Content-Type', 'text/csv');
      res.attachment('ticket_sales_report.csv');
      return res.send(data);
    } else {
      res.header('Content-Type', 'application/json');
      return res.json(data);
    }
  }

  @Get('reports/transfers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'analyst')
  @ApiOperation({ summary: 'Generate ticket transfers report' })
  async generateTransfersReport(
    @Res() res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('format') format: string = 'csv',
  ) {
    const data = await this.ticketService.generateTransfersReport({
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
    
    if (format === 'csv') {
      res.header('Content-Type', 'text/csv');
      res.attachment('ticket_transfers_report.csv');
      return res.send(data);
    } else {
      res.header('Content-Type', 'application/json');
      return res.json(data);
    }
  }
}
