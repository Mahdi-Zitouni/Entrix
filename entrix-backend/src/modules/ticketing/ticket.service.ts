import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from './ticket.entity';
import {
  TicketTransfer,
  TicketTransferStatus,
  EscrowStatus,
} from './ticket-transfer.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import * as QRCode from 'qrcode';
import { NotificationService } from '../notifications/notification.service';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import { EventRestrictionService } from '../events/event-restriction.service';
import { UsersService } from '../users/users.service';
import { EventStatsService } from '../events/event-stats.service';
import { BlacklistService } from './blacklist.service';
import { PricingRules, PricingRuleType } from './pricing-rules.entity';
import { TicketType } from './ticket-type.entity';
import { LessThanOrEqual, MoreThanOrEqual, Like, Between } from 'typeorm';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(TicketTransfer)
    private readonly ticketTransferRepository: Repository<TicketTransfer>,
    private readonly notificationService: NotificationService,
    private readonly eventRestrictionService: EventRestrictionService,
    private readonly usersService: UsersService,
    private readonly eventStatsService: EventStatsService,
    private readonly blacklistService: BlacklistService,
    @InjectRepository(PricingRules)
    private readonly pricingRulesRepository: Repository<PricingRules>,
    @InjectRepository(TicketType)
    private readonly ticketTypeRepository: Repository<TicketType>,
  ) {}

  async findAll(filters?: {
    eventId?: string;
    userId?: string;
    status?: string;
    type?: string;
    from?: Date;
    to?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ data: Ticket[]; total: number; page: number; limit: number }> {
    const query = this.ticketRepository.createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.event', 'event')
      .leftJoinAndSelect('ticket.user', 'user')
      .leftJoinAndSelect('ticket.ticketType', 'ticketType');

    if (filters?.eventId) {
      query.andWhere('ticket.eventId = :eventId', { eventId: filters.eventId });
    }
    if (filters?.userId) {
      query.andWhere('ticket.userId = :userId', { userId: filters.userId });
    }
    if (filters?.status) {
      query.andWhere('ticket.status = :status', { status: filters.status });
    }
    if (filters?.type) {
      query.andWhere('ticketType.name = :type', { type: filters.type });
    }
    if (filters?.from || filters?.to) {
      const whereCondition: any = {};
      if (filters.from) whereCondition.createdAt = MoreThanOrEqual(filters.from);
      if (filters.to) whereCondition.createdAt = LessThanOrEqual(filters.to);
      query.andWhere(whereCondition);
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await query
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async searchTickets(query: string, filters: any): Promise<Ticket[]> {
    const qb = this.ticketRepository.createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.event', 'event')
      .leftJoinAndSelect('ticket.user', 'user')
      .where('ticket.id LIKE :query OR event.name LIKE :query OR user.email LIKE :query', 
        { query: `%${query}%` });

    if (filters.eventId) {
      qb.andWhere('ticket.eventId = :eventId', { eventId: filters.eventId });
    }
    if (filters.status) {
      qb.andWhere('ticket.status = :status', { status: filters.status });
    }

    return qb.getMany();
  }

  async getUserTickets(userId: string, filters?: { status?: string; eventId?: string }): Promise<Ticket[]> {
    const query = this.ticketRepository.createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.event', 'event')
      .where('ticket.userId = :userId', { userId });

    if (filters?.status) {
      query.andWhere('ticket.status = :status', { status: filters.status });
    }
    if (filters?.eventId) {
      query.andWhere('ticket.eventId = :eventId', { eventId: filters.eventId });
    }

    return query.getMany();
  }

  async validateTicket(ticketId: string, accessPoint?: string, validatorId?: string): Promise<any> {
    const ticket = await this.findOne(ticketId);
    
    if (!ticket) {
      throw new Error('Ticket not found');
    }
    
    if (ticket.bookingStatus !== 'CONFIRMED') {
      throw new Error(`Ticket is not active. Status: ${ticket.bookingStatus}`);
    }

    // Check if ticket is already used
    if (ticket.usedAt) {
      throw new Error('Ticket has already been used');
    }

    // Mark as used
    ticket.usedAt = new Date();
    ticket.usedBy = validatorId;
    ticket.accessPoint = accessPoint;
    await this.ticketRepository.save(ticket);

    return {
      valid: true,
      ticket,
      message: 'Ticket validated successfully'
    };
  }

  async bulkValidateTickets(ticketIds: string[], accessPoint?: string, validatorId?: string): Promise<any[]> {
    const results = [];
    for (const ticketId of ticketIds) {
      try {
        const result = await this.validateTicket(ticketId, accessPoint, validatorId);
        results.push({ ticketId, success: true, result });
      } catch (error) {
        results.push({ ticketId, success: false, error: error.message });
      }
    }
    return results;
  }

  async getPerformanceAnalytics(filters?: { eventId?: string; from?: Date; to?: Date }): Promise<any> {
    const query = this.ticketRepository.createQueryBuilder('ticket')
      .select([
        'COUNT(*) as totalTickets',
        'SUM(CASE WHEN ticket.bookingStatus = :activeStatus THEN 1 ELSE 0 END) as activeTickets',
        'SUM(CASE WHEN ticket.bookingStatus = :confirmedStatus THEN 1 ELSE 0 END) as confirmedTickets',
        'SUM(ticket.pricePaid) as totalRevenue'
      ])
      .setParameter('activeStatus', 'active')
      .setParameter('confirmedStatus', 'CONFIRMED');

    if (filters?.eventId) {
      query.andWhere('ticket.eventId = :eventId', { eventId: filters.eventId });
    }
    if (filters?.from || filters?.to) {
      const whereCondition: any = {};
      if (filters.from) whereCondition.createdAt = MoreThanOrEqual(filters.from);
      if (filters.to) whereCondition.createdAt = LessThanOrEqual(filters.to);
      query.andWhere(whereCondition);
    }

    const result = await query.getRawOne();
    return {
      totalTickets: parseInt(result.totalTickets),
      activeTickets: parseInt(result.activeTickets),
      confirmedTickets: parseInt(result.confirmedTickets),
      totalRevenue: parseFloat(result.totalRevenue) || 0,
      confirmationRate: result.totalTickets > 0 ? (result.confirmedTickets / result.totalTickets) * 100 : 0
    };
  }

  async getTransferAnalytics(filters?: { eventId?: string; from?: Date; to?: Date }): Promise<any> {
    const query = this.ticketTransferRepository.createQueryBuilder('transfer')
      .select([
        'COUNT(*) as totalTransfers',
        'SUM(CASE WHEN transfer.status = :completedStatus THEN 1 ELSE 0 END) as completedTransfers',
        'SUM(CASE WHEN transfer.status = :pendingStatus THEN 1 ELSE 0 END) as pendingTransfers',
        'SUM(transfer.price) as totalTransferValue'
      ])
      .setParameter('completedStatus', TicketTransferStatus.COMPLETED)
      .setParameter('pendingStatus', TicketTransferStatus.PENDING);

    if (filters?.eventId) {
      query.andWhere('transfer.ticket.eventId = :eventId', { eventId: filters.eventId });
    }
    if (filters?.from || filters?.to) {
      const whereCondition: any = {};
      if (filters.from) whereCondition.createdAt = MoreThanOrEqual(filters.from);
      if (filters.to) whereCondition.createdAt = LessThanOrEqual(filters.to);
      query.andWhere(whereCondition);
    }

    const result = await query.getRawOne();
    return {
      totalTransfers: parseInt(result.totalTransfers),
      completedTransfers: parseInt(result.completedTransfers),
      pendingTransfers: parseInt(result.pendingTransfers),
      totalTransferValue: parseFloat(result.totalTransferValue) || 0,
      completionRate: result.totalTransfers > 0 ? (result.completedTransfers / result.totalTransfers) * 100 : 0
    };
  }

  async getTicketDetails(ticketId: string, userId: string): Promise<any> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
      // Remove relations that don't exist
      // relations: ['event', 'user', 'ticketType', 'transfers']
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Check if user has access to this ticket
    if (ticket.userId !== userId) {
      throw new Error('Access denied');
    }

    return {
      ...ticket,
      qrCode: await this.generateTicketQrCode(ticketId),
      barcode: await this.generateTicketBarcode(ticketId)
    };
  }

  async getTicketAccessRights(ticketId: string, userId: string): Promise<any> {
    const ticket = await this.findOne(ticketId);
    
    if (!ticket) {
      throw new Error('Ticket not found');
    }
    
    if (ticket.userId !== userId) {
      throw new Error('Access denied');
    }

    return {
      canUse: ticket.bookingStatus === 'CONFIRMED' && !ticket.usedAt,
      canTransfer: ticket.isTransferable && ticket.bookingStatus === 'CONFIRMED',
      canRefund: ticket.bookingStatus === 'CONFIRMED' && !ticket.usedAt,
    };
  }

  async getTicketUsageHistory(ticketId: string): Promise<any[]> {
    // This would typically come from an access control log service
    // For now, return mock data
    return [
      {
        timestamp: new Date(),
        action: 'validation',
        accessPoint: 'main_gate',
        validator: 'validator_123',
        success: true
      }
    ];
  }

  async create(createDto: CreateTicketDto, createdBy?: string): Promise<Ticket> {
    // Enforce event restrictions
    const restrictions = await this.eventRestrictionService.findAll();
    const eventRestrictions = restrictions.filter((r: any) => r.event.id === createDto.eventId);
    if (eventRestrictions.length > 0 && createDto.userId) {
      const user = await this.usersService.findOne(createDto.userId);
      for (const restriction of eventRestrictions) {
        if (restriction.restrictionType === 'AGE_MIN') {
          const minAge = Number(restriction.value);
          const dob = user.profile?.dateOfBirth;
          if (!dob) throw new Error('User profile missing date of birth for age restriction check.');
          const age = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
          if (age < minAge) throw new Error(`User does not meet minimum age requirement (${minAge}) for this event.`);
        }
        if (restriction.restrictionType === 'GROUP_REQUIRED') {
          const requiredGroup = restriction.value;
          const inGroup = user.userGroups?.some(ug => ug.group?.id === requiredGroup || ug.group?.name === requiredGroup);
          if (!inGroup) throw new Error(`User must be in group ${requiredGroup} to purchase ticket for this event.`);
        }
        // Add more restriction types as needed
      }
    }
    // Enforce blacklist
    if (createDto.userId && createDto.eventId) {
      const isBlacklisted = await this.blacklistService.isBlacklisted({ userId: createDto.userId, eventId: createDto.eventId });
      if (isBlacklisted) throw new Error('User is blacklisted and cannot purchase tickets for this event.');
    }
    // Dynamic pricing
    if (createDto.eventId && createDto.ticketTypeId) {
      const now = new Date();
      const rules = await this.pricingRulesRepository.find({
        where: { event: { id: createDto.eventId }, ticketType: { id: createDto.ticketTypeId }, isActive: true },
        order: { priority: 'DESC' },
      });
      let price = createDto.pricePaid;
      for (const rule of rules) {
        const validFrom = rule.validFrom ? new Date(rule.validFrom) : undefined;
        const validUntil = rule.validUntil ? new Date(rule.validUntil) : undefined;
        if ((validFrom && now < validFrom) || (validUntil && now > validUntil)) continue;
        if (rule.ruleType === PricingRuleType.PERCENTAGE && rule.value) {
          price = price * (1 - rule.value / 100);
        } else if (rule.ruleType === PricingRuleType.FIXED_AMOUNT && rule.value) {
          price = price - rule.value;
        }
        // Add more rule types as needed
      }
      createDto.pricePaid = Math.max(0, price);
    }
    const ticket = this.ticketRepository.create(createDto);
    const saved = await this.ticketRepository.save(ticket);
    // Notify user (stub: email)
    if (createDto.userId) {
      this.notificationService.sendNotification({
        channel: 'email',
        recipient: createDto.userId,
        template: 'ticket_purchase',
        data: { ticket: saved },
      });
    }
    // Update event stats
    if (createDto.eventId) {
      const stats = await this.eventStatsService.getEventPopularity(createDto.eventId);
      await this.eventStatsService.upsertStats(createDto.eventId, stats);
    }
    return saved;
  }

  async bulkCreate(createDtos: CreateTicketDto[], createdBy?: string): Promise<Ticket[]> {
    const tickets = [];
    for (const dto of createDtos) {
      try {
        const ticket = await this.create(dto, createdBy);
        tickets.push(ticket);
      } catch (error) {
        console.error(`Failed to create ticket: ${error.message}`);
        // Continue with other tickets
      }
    }
    return tickets;
  }

  async importTickets(file: Express.Multer.File, importedBy?: string): Promise<any> {
    // This would parse CSV/Excel file and create tickets
    // For now, return mock result
    return {
      success: true,
      imported: 10,
      failed: 0,
      errors: []
    };
  }

  async update(id: string, updateDto: UpdateTicketDto, updatedBy?: string): Promise<Ticket> {
    const ticket = await this.findOne(id);
    
    if (!ticket) {
      throw new Error('Ticket not found');
    }
    
    Object.assign(ticket, updateDto);
    return this.ticketRepository.save(ticket);
  }

  async updateStatus(id: string, status: string, reason?: string, updatedBy?: string): Promise<Ticket> {
    const ticket = await this.findOne(id);
    if (!ticket) throw new NotFoundException('Ticket not found');
    ticket.status = status;
    ticket.statusReason = reason;
    ticket.statusUpdatedAt = new Date();
    ticket.statusUpdatedBy = updatedBy;
    return this.ticketRepository.save(ticket);
  }

  async updatePricing(id: string, pricingData: any, updatedBy?: string): Promise<Ticket> {
    const ticket = await this.findOne(id);
    if (!ticket) throw new NotFoundException('Ticket not found');
    Object.assign(ticket, pricingData);
    return this.ticketRepository.save(ticket);
  }

  async remove(id: string, removedBy?: string): Promise<void> {
    const ticket = await this.findOne(id);
    if (!ticket) throw new NotFoundException('Ticket not found');
    await this.ticketRepository.remove(ticket);
  }

  // List a ticket for transfer
  async listForTransfer(
    ticketId: string,
    sellerId: string,
    price: number,
    commission: number,
    userId?: string,
  ) {
    const ticket = await this.findOne(ticketId);
    if (!ticket) throw new NotFoundException('Ticket not found');
    if (!ticket.isTransferable) throw new Error('Ticket is not transferable');
    ticket.transferStatus = TicketTransferStatus.LISTED as any;
    ticket.transferPrice = price;
    ticket.transferCommission = commission;
    await this.ticketRepository.save(ticket);
    // Create transfer record
    const transfer = this.ticketTransferRepository.create({
      ticket,
      sellerId,
      price,
      commission,
      status: TicketTransferStatus.PENDING,
    });
    return this.ticketTransferRepository.save(transfer);
  }

  // Claim/purchase a transfer
  async claimTransfer(transferId: string, buyerId: string, claimedBy?: string) {
    const transfer = await this.ticketTransferRepository.findOne({
      where: { id: transferId },
      relations: ['ticket'],
    });
    if (!transfer || transfer.status !== TicketTransferStatus.LISTED)
      throw new Error('Transfer not available');
    transfer.buyerId = buyerId;
    transfer.status = TicketTransferStatus.PENDING;
    transfer.escrowStatus = EscrowStatus.HELD;
    await this.ticketTransferRepository.save(transfer);
    // Invalidate old access_right (stub)
    console.log(`[AccessRights] Invalidate access rights for ticket ${transfer.ticket.id}`);
    // Create new access_right for buyer (stub)
    console.log(`[AccessRights] Create new access rights for buyer ${buyerId} for ticket ${transfer.ticket.id}`);
    // TODO: Integrate with access rights system
    // Log action, notify parties (stub)
    return transfer;
  }

  // Complete a transfer (admin or after payment)
  async completeTransfer(transferId: string, completedBy?: string) {
    const transfer = await this.ticketTransferRepository.findOne({
      where: { id: transferId },
      relations: ['ticket'],
    });
    if (!transfer || transfer.status !== TicketTransferStatus.PENDING)
      throw new Error('Transfer not pending');
    transfer.status = TicketTransferStatus.COMPLETED;
    transfer.escrowStatus = EscrowStatus.RELEASED;
    transfer.completedAt = new Date();
    await this.ticketTransferRepository.save(transfer);
    // Notify buyer and seller (stub: email)
    if (transfer.buyerId) {
      this.notificationService.sendNotification({
        channel: 'email',
        recipient: transfer.buyerId,
        template: 'ticket_transfer_complete',
        data: { transfer },
      });
    }
    if (transfer.sellerId) {
      this.notificationService.sendNotification({
        channel: 'email',
        recipient: transfer.sellerId,
        template: 'ticket_transfer_complete',
        data: { transfer },
      });
    }
    return transfer;
  }

  async cancelTransfer(transferId: string, cancelledBy?: string) {
    const transfer = await this.ticketTransferRepository.findOne({
      where: { id: transferId },
      relations: ['ticket'],
    });
    if (!transfer) throw new Error('Transfer not found');
    transfer.status = TicketTransferStatus.CANCELLED;
    transfer.escrowStatus = EscrowStatus.REFUNDED;
    transfer.cancelledAt = new Date();
    await this.ticketTransferRepository.save(transfer);
    // Notify parties (stub: email)
    if (transfer.buyerId) {
      this.notificationService.sendNotification({
        channel: 'email',
        recipient: transfer.buyerId,
        template: 'ticket_transfer_cancelled',
        data: { transfer },
      });
    }
    if (transfer.sellerId) {
      this.notificationService.sendNotification({
        channel: 'email',
        recipient: transfer.sellerId,
        template: 'ticket_transfer_cancelled',
        data: { transfer },
      });
    }
    return transfer;
  }

  async generateTicketQrCode(ticketId: string, userId?: string): Promise<string> {
    const ticket = await this.findOne(ticketId);
    
    if (!ticket) {
      throw new Error('Ticket not found');
    }
    
    if (userId && ticket.userId !== userId) {
      throw new Error('Access denied');
    }

    const qrData = `${ticket.id}-${ticket.eventId}-${ticket.userId}`;
    return QRCode.toDataURL(qrData);
  }

  async generateTicketBarcode(ticketId: string, userId?: string): Promise<string> {
    const ticket = await this.findOne(ticketId);
    
    if (!ticket) {
      throw new Error('Ticket not found');
    }
    
    if (userId && ticket.userId !== userId) {
      throw new Error('Access denied');
    }

    const barcodeData = `${ticket.id}-${ticket.eventId}-${ticket.userId}`;
    // In a real implementation, you would generate an actual barcode
    return barcodeData;
  }

  async getTransferHistory(ticketId: string, userId?: string): Promise<TicketTransfer[]> {
    const ticket = await this.findOne(ticketId);
    
    if (!ticket) {
      throw new Error('Ticket not found');
    }
    
    if (userId && ticket.userId !== userId) {
      throw new Error('Access denied');
    }

    return this.ticketTransferRepository.find({
      where: { ticket: { id: ticketId } },
      order: { createdAt: 'DESC' },
    });
  }

  async generateTicketPdf(ticketId: string, userId?: string): Promise<Buffer> {
    const ticket = await this.findOne(ticketId);
    
    if (!ticket) {
      throw new Error('Ticket not found');
    }
    
    if (userId && ticket.userId !== userId) {
      throw new Error('Access denied');
    }

    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {});

    doc.fontSize(20).text('ENTRIX TICKET', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Ticket ID: ${ticket.id}`);
    doc.text(`Event: ${ticket.eventId}`);
    doc.text(`User: ${ticket.userId}`);
    doc.text(`Price: $${ticket.pricePaid}`);
    doc.text(`Status: ${ticket.bookingStatus}`);

    doc.end();

    return Buffer.concat(chunks);
  }

  async bulkAssign(ticketIds: string[], userId: string, assignedBy?: string) {
    const results = [];
    for (const ticketId of ticketIds) {
      try {
        const ticket = await this.findOne(ticketId);
        if (ticket) {
          ticket.userId = userId;
          await this.ticketRepository.save(ticket);
          results.push({ ticketId, success: true });
        }
      } catch (error) {
        results.push({ ticketId, success: false, error: error.message });
      }
    }
    return results;
  }

  async bulkRevoke(ticketIds: string[], revokedBy?: string) {
    const results = [];
    for (const ticketId of ticketIds) {
      try {
        await this.updateStatus(ticketId, 'revoked', 'Bulk revocation', revokedBy);
        results.push({ ticketId, success: true });
      } catch (error) {
        results.push({ ticketId, success: false, error: error.message });
      }
    }
    return results;
  }

  async bulkExport(filters: any, format: string): Promise<any> {
    const tickets = await this.findAll(filters);
    
    if (format === 'csv') {
      // Convert to CSV format
      const csvData = tickets.data.map(ticket => ({
        id: ticket.id,
        eventId: ticket.eventId,
        userId: ticket.userId,
        status: ticket.status,
        pricePaid: ticket.pricePaid,
        createdAt: ticket.createdAt
      }));
      return csvData;
    }
    
    return tickets.data;
  }

  async findTransfersByQuery(query: { status?: string; eventId?: string; sellerId?: string; buyerId?: string; from?: Date; to?: Date }) {
    const qb = this.ticketTransferRepository.createQueryBuilder('transfer')
      .leftJoinAndSelect('transfer.ticket', 'ticket');

    if (query.status) {
      qb.andWhere('transfer.status = :status', { status: query.status });
    }
    if (query.eventId) {
      qb.andWhere('ticket.eventId = :eventId', { eventId: query.eventId });
    }
    if (query.sellerId) {
      qb.andWhere('transfer.sellerId = :sellerId', { sellerId: query.sellerId });
    }
    if (query.buyerId) {
      qb.andWhere('transfer.buyerId = :buyerId', { buyerId: query.buyerId });
    }
    if (query.from || query.to) {
      const whereCondition: any = {};
      if (query.from) whereCondition.createdAt = MoreThanOrEqual(query.from);
      if (query.to) whereCondition.createdAt = LessThanOrEqual(query.to);
      qb.andWhere(whereCondition);
    }

    return qb.getMany();
  }

  async approveTransfer(id: string, approvedBy?: string) {
    const transfer = await this.ticketTransferRepository.findOne({
      where: { id },
      relations: ['ticket']
    });
    
    if (!transfer) throw new Error('Transfer not found');
    if (transfer.status !== TicketTransferStatus.PENDING) {
      throw new Error('Transfer is not pending approval');
    }
    
    transfer.status = TicketTransferStatus.APPROVED;
    transfer.approvedAt = new Date();
    transfer.approvedBy = approvedBy;
    
    return this.ticketTransferRepository.save(transfer);
  }

  async rejectTransfer(id: string, reason?: string, rejectedBy?: string) {
    const transfer = await this.ticketTransferRepository.findOne({
      where: { id },
      relations: ['ticket']
    });
    
    if (!transfer) throw new Error('Transfer not found');
    if (transfer.status !== TicketTransferStatus.PENDING) {
      throw new Error('Transfer is not pending approval');
    }
    
    transfer.status = TicketTransferStatus.REJECTED;
    transfer.rejectedAt = new Date();
    transfer.rejectedBy = rejectedBy;
    transfer.rejectionReason = reason;
    
    return this.ticketTransferRepository.save(transfer);
  }

  async requestRefund(ticketId: string, reason: string, amount?: number, requestedBy?: string) {
    const ticket = await this.findOne(ticketId);
    
    if (!ticket) {
      throw new Error('Ticket not found');
    }
    
    if (ticket.bookingStatus !== 'CONFIRMED') {
      throw new Error('Ticket is not confirmed and cannot be refunded');
    }

    if (ticket.usedAt) {
      throw new Error('Ticket has already been used and cannot be refunded');
    }

    const refundAmount = amount || ticket.pricePaid;
    
    // Create refund request
    const refundRequest = {
      ticketId,
      userId: ticket.userId,
      amount: refundAmount,
      reason,
      requestedBy,
      status: 'PENDING',
    };

    return refundRequest;
  }

  async checkRefundEligibility(ticketId: string, userId: string): Promise<any> {
    const ticket = await this.findOne(ticketId);
    
    if (!ticket) {
      throw new Error('Ticket not found');
    }
    
    if (ticket.userId !== userId) {
      throw new Error('Access denied');
    }

    const isEligible = ticket.bookingStatus === 'CONFIRMED' && !ticket.usedAt;
    const refundAmount = isEligible ? ticket.pricePaid : 0;

    return {
      isEligible,
      refundAmount,
      reason: isEligible ? null : 'Ticket is not eligible for refund',
    };
  }

  async logAccessAttempt(ticketId: string, accessData: any, loggedBy?: string): Promise<any> {
    const ticket = await this.findOne(ticketId);
    
    // Log access attempt
    const logEntry = {
      ticketId,
      accessPoint: accessData.accessPoint,
      success: accessData.success,
      reason: accessData.reason,
      loggedBy,
      timestamp: new Date()
    };
    
    // In a real implementation, this would be saved to an access log table
    console.log('Access attempt logged:', logEntry);
    
    return logEntry;
  }

  async generateSalesReport(filters?: { eventId?: string; from?: Date; to?: Date }): Promise<any[]> {
    const query = this.ticketRepository.createQueryBuilder('ticket')
      .select([
        'ticket.id',
        'ticket.pricePaid',
        'ticket.status',
        'ticket.createdAt',
        'event.name as eventName',
        'user.email as userEmail'
      ])
      .leftJoin('ticket.event', 'event')
      .leftJoin('ticket.user', 'user');

    if (filters?.eventId) {
      query.andWhere('ticket.eventId = :eventId', { eventId: filters.eventId });
    }
    if (filters?.from || filters?.to) {
      const whereCondition: any = {};
      if (filters.from) whereCondition.createdAt = MoreThanOrEqual(filters.from);
      if (filters.to) whereCondition.createdAt = LessThanOrEqual(filters.to);
      query.andWhere(whereCondition);
    }

    return query.getRawMany();
  }

  async generateTransfersReport(filters?: { from?: Date; to?: Date }): Promise<any[]> {
    const query = this.ticketTransferRepository.createQueryBuilder('transfer')
      .select([
        'transfer.id',
        'transfer.price',
        'transfer.status',
        'transfer.createdAt',
        'ticket.id as ticketId',
        'event.name as eventName'
      ])
      .leftJoin('transfer.ticket', 'ticket')
      .leftJoin('ticket.event', 'event');

    if (filters?.from || filters?.to) {
      const whereCondition: any = {};
      if (filters.from) whereCondition.createdAt = MoreThanOrEqual(filters.from);
      if (filters.to) whereCondition.createdAt = LessThanOrEqual(filters.to);
      query.andWhere(whereCondition);
    }

    return query.getRawMany();
  }

  private async getTicketRestrictions(ticketId: string): Promise<any[]> {
    // This would check various restrictions for the ticket
    // For now, return empty array
    return [];
  }

  async getSalesByEventAndDate({
    eventId,
    from,
    to,
    groupBy = 'day',
  }: {
    eventId?: string;
    from?: Date;
    to?: Date;
    groupBy?: string;
  }) {
    const query = this.ticketRepository.createQueryBuilder('ticket')
      .select([
        'DATE(ticket.createdAt) as date',
        'COUNT(*) as ticketsSold',
        'SUM(ticket.pricePaid) as revenue'
      ])
      .groupBy('DATE(ticket.createdAt)')
      .orderBy('date', 'ASC');

    if (eventId) {
      query.andWhere('ticket.eventId = :eventId', { eventId });
    }
    if (from) {
      query.andWhere('ticket.createdAt >= :from', { from });
    }
    if (to) {
      query.andWhere('ticket.createdAt <= :to', { to });
    }

    return query.getRawMany();
  }

  async findOne(id: string) {
    // TODO: Implement find one ticket
    return this.ticketRepository.findOne({ where: { id } });
  }
}
