import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seat } from './seat.entity';
import { SeatStatusEnum, SeatTypeEnum } from './seat.entity';

// Define interfaces for metadata structure
interface SeatReservation {
  reservedBy: string;
  reservationExpiresAt: Date;
}

interface SeatMetadata {
  reservation?: SeatReservation;
  statusHistory?: Array<{
    from: string;
    to: string;
    reason?: string;
    changedBy?: string;
    changedAt: Date;
  }>;
  zoneName?: string;
  zoneDescription?: string;
  pricing?: any;
  zonePricing?: any;
}

@Injectable()
export class SeatService {
  constructor(
    @InjectRepository(Seat)
    private readonly seatRepository: Repository<Seat>,
  ) {}

  async createSeat(dto: Partial<Seat>, createdBy?: string): Promise<Seat> {
    const seat = this.seatRepository.create(dto);
    return await this.seatRepository.save(seat);
  }

  async findAllSeats(filters?: any): Promise<Seat[]> {
    const queryBuilder = this.seatRepository.createQueryBuilder('seat')
      .leftJoinAndSelect('seat.zone', 'zone')
      .leftJoinAndSelect('seat.venue', 'venue');

    if (filters?.venueId) {
      queryBuilder.andWhere('seat.venueId = :venueId', { venueId: filters.venueId });
    }
    if (filters?.zoneId) {
      queryBuilder.andWhere('seat.zoneId = :zoneId', { zoneId: filters.zoneId });
    }
    if (filters?.status) {
      queryBuilder.andWhere('seat.status = :status', { status: filters.status });
    }
    if (filters?.seatType) {
      queryBuilder.andWhere('seat.seatType = :seatType', { seatType: filters.seatType });
    }

    return await queryBuilder.getMany();
  }

  async findSeatById(id: string): Promise<Seat> {
    const seat = await this.seatRepository.findOne({ 
      where: { id },
      relations: ['zone', 'venue']
    });
    if (!seat) {
      throw new Error('Seat not found');
    }
    return seat;
  }

  async updateSeat(id: string, dto: Partial<Seat>, updatedBy?: string): Promise<Seat> {
    const seat = await this.findSeatById(id);
    
    // Update only the properties that can be safely updated
    if (dto.reference !== undefined) seat.reference = dto.reference;
    if (dto.label !== undefined) seat.label = dto.label;
    if (dto.row !== undefined) seat.row = dto.row;
    if (dto.number !== undefined) seat.number = dto.number;
    if (dto.section !== undefined) seat.section = dto.section;
    if (dto.seatType !== undefined) seat.seatType = dto.seatType;
    if (dto.status !== undefined) seat.status = dto.status;
    if (dto.coordinates !== undefined) seat.coordinates = dto.coordinates;
    if (dto.metadata !== undefined) seat.metadata = dto.metadata;
    
    return await this.seatRepository.save(seat);
  }

  async removeSeat(id: string, removedBy?: string): Promise<void> {
    const seat = await this.findSeatById(id);
    await this.seatRepository.remove(seat);
  }

  // --- Controller contract implementations below ---

  async getZones(filters?: any) {
    const seats = await this.findAllSeats(filters);
    
    // Group seats by zone
    const zones = new Map();
    for (const seat of seats) {
      if (seat.zone) {
        const zoneId = seat.zone.id;
        if (!zones.has(zoneId)) {
          zones.set(zoneId, {
            id: zoneId,
            name: seat.zone.name,
            description: seat.zone.description,
            capacity: 0,
            availableSeats: 0,
            occupiedSeats: 0,
            seats: [],
          });
        }
        const zone = zones.get(zoneId);
        zone.capacity++;
        zone.seats.push(seat);
        if (seat.status === SeatStatusEnum.AVAILABLE) {
          zone.availableSeats++;
        } else {
          zone.occupiedSeats++;
        }
      }
    }
    
    return Array.from(zones.values());
  }

  async getZoneHierarchy(zoneId: string) {
    // In a real implementation, you would query a zones table with parent-child relationships
    // For now, return a mock hierarchy
    const seats = await this.findAllSeats({ zoneId });
    
    if (seats.length === 0) {
      throw new Error('Zone not found');
    }
    
    const zone = seats[0].zone;
    return {
      id: zone.id,
      name: zone.name,
      description: zone.description,
      parent: null, // In real implementation, this would be the parent zone
      children: [], // In real implementation, this would be child zones
      seats: seats.length,
    };
  }

  async getSeatsInZone(zoneId: string, available?: boolean) {
    const filters: any = { zoneId };
    if (available !== undefined) {
      filters.status = available ? SeatStatusEnum.AVAILABLE : SeatStatusEnum.SOLD;
    }
    
    return await this.findAllSeats(filters);
  }

  async checkSeatAvailability(id: string, eventId?: string, date?: Date) {
    const seat = await this.findSeatById(id);
    
    const isAvailable = seat.status === SeatStatusEnum.AVAILABLE;
    
    // Check if seat is reserved and reservation hasn't expired
    const metadata = seat.metadata as SeatMetadata | undefined;
    if (metadata?.reservation) {
      const reservation = metadata.reservation;
      if (reservation.reservationExpiresAt > new Date()) {
        return {
          id,
          available: false,
          reason: 'Seat is reserved',
          reservedBy: reservation.reservedBy,
          expiresAt: reservation.reservationExpiresAt,
        };
      }
    }
    
    return {
      id,
      available: isAvailable,
      status: seat.status,
      seatType: seat.seatType,
      pricing: await this.getSeatPricing(id),
    };
  }

  async getSeatPricing(id: string) {
    const seat = await this.findSeatById(id);
    
    // In a real implementation, you would query a pricing table
    // For now, return mock pricing based on seat type
    const basePrice = 50;
    let finalPrice = basePrice;
    
    switch (seat.seatType) {
      case SeatTypeEnum.PREMIUM:
        finalPrice = basePrice * 2;
        break;
      case SeatTypeEnum.VIP:
        finalPrice = basePrice * 3;
        break;
      case SeatTypeEnum.ACCESSIBLE:
        finalPrice = basePrice * 0.8; // Discount for accessibility
        break;
      default:
        finalPrice = basePrice;
    }
    
    // Check for zone-specific pricing
    const metadata = seat.metadata as SeatMetadata | undefined;
    if (metadata?.zonePricing) {
      finalPrice = metadata.zonePricing.price || finalPrice;
    }
    
    return {
      seatId: id,
      basePrice,
      finalPrice,
      currency: 'USD',
      seatType: seat.seatType,
      pricing: {
        basePrice,
        finalPrice,
        currency: 'USD',
        seatType: seat.seatType,
      },
    };
  }

  async getSeatReservations(id: string, filters?: any) {
    const seat = await this.findSeatById(id);
    const metadata = seat.metadata as SeatMetadata | undefined;
    
    if (!metadata?.reservation) {
      return [];
    }
    
    return [{
      seatId: id,
      reservedBy: metadata.reservation.reservedBy,
      expiresAt: metadata.reservation.reservationExpiresAt,
      status: 'active',
    }];
  }

  async createZone(zoneData: any, createdBy?: string) {
    // In a real implementation, you would create a zone in a zones table
    // For now, return a mock zone creation
    return {
      id: `zone_${Date.now()}`,
      name: zoneData.name,
      description: zoneData.description,
      capacity: zoneData.capacity || 0,
      createdBy,
      createdAt: new Date(),
    };
  }

  async reserveSeat(id: string, body: any, userId?: string) {
    const seat = await this.findSeatById(id);
    
    if (seat.status !== SeatStatusEnum.AVAILABLE) {
      throw new Error('Seat is not available for reservation');
    }
    
    // Check if seat is already reserved
    const metadata = seat.metadata as SeatMetadata | undefined;
    if (metadata?.reservation) {
      const reservation = metadata.reservation;
      if (reservation.reservationExpiresAt > new Date()) {
        throw new Error('Seat is already reserved');
      }
    }
    
    // Reserve the seat
    seat.status = SeatStatusEnum.SOLD;
    
    // Set reservation metadata
    if (!seat.metadata) {
      seat.metadata = {};
    }
    (seat.metadata as SeatMetadata).reservation = {
      reservedBy: userId || 'unknown',
      reservationExpiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    };
    
    await this.seatRepository.save(seat);
    
    return { 
      id, 
      reserved: true, 
      userId,
      expiresAt: (seat.metadata as SeatMetadata).reservation!.reservationExpiresAt,
    };
  }

  async releaseSeat(id: string, body: any, userId?: string) {
    const seat = await this.findSeatById(id);
    
    // Check if the seat is reserved by the same user
    const metadata = seat.metadata as SeatMetadata | undefined;
    const reservation = metadata?.reservation;
    if (reservation && reservation.reservedBy && reservation.reservedBy !== userId) {
      throw new Error('Cannot release seat reserved by another user');
    }
    
    // Release the seat
    seat.status = SeatStatusEnum.AVAILABLE;
    
    // Clear reservation info
    if (metadata?.reservation) {
      delete (seat.metadata as SeatMetadata).reservation;
    }
    
    await this.seatRepository.save(seat);
    
    return { id, released: true, userId };
  }

  async updateZone(zoneId: string, zoneData: any, userId?: string) {
    // In a real implementation, you would update the zone in a zones table
    // For now, update all seats in the zone
    const seats = await this.findAllSeats({ zoneId });
    
    for (const seat of seats) {
      // Update zone-related metadata
      if (!seat.metadata) {
        seat.metadata = {};
      }
      const metadata = seat.metadata as SeatMetadata;
      if (zoneData.name) {
        metadata.zoneName = zoneData.name;
      }
      if (zoneData.description) {
        metadata.zoneDescription = zoneData.description;
      }
      await this.seatRepository.save(seat);
    }
    
    return { zoneId, zone: zoneData, userId };
  }

  async updateSeatPricing(id: string, pricingData: any, userId?: string) {
    const seat = await this.findSeatById(id);
    
    // In a real implementation, you would update a separate pricing table
    // For now, store pricing in seat metadata
    if (!seat.metadata) {
      seat.metadata = {};
    }
    (seat.metadata as SeatMetadata).pricing = pricingData;
    
    await this.seatRepository.save(seat);
    
    return { id, pricing: pricingData, userId };
  }

  async updateZonePricing(zoneId: string, pricingData: any, userId?: string) {
    // Update pricing for all seats in the zone
    const seats = await this.findAllSeats({ zoneId });
    
    for (const seat of seats) {
      if (!seat.metadata) {
        seat.metadata = {};
      }
      (seat.metadata as SeatMetadata).zonePricing = pricingData;
      await this.seatRepository.save(seat);
    }
    
    return { zoneId, pricing: pricingData, userId };
  }

  async updateSeatStatus(id: string, status: string, reason?: string, userId?: string) {
    const seat = await this.findSeatById(id);
    
    const oldStatus = seat.status;
    seat.status = status as SeatStatusEnum;
    
    // Update metadata with status change
    if (!seat.metadata) {
      seat.metadata = {};
    }
    const metadata = seat.metadata as SeatMetadata;
    if (!metadata.statusHistory) {
      metadata.statusHistory = [];
    }
    metadata.statusHistory.push({
      from: oldStatus,
      to: status,
      reason,
      changedBy: userId,
      changedAt: new Date(),
    });
    
    await this.seatRepository.save(seat);
    
    return { id, status, reason, userId };
  }

  async removeZone(zoneId: string, userId?: string) {
    // In a real implementation, you would remove the zone from a zones table
    // For now, mark all seats in the zone as blocked
    const seats = await this.findAllSeats({ zoneId });
    
    for (const seat of seats) {
      seat.status = SeatStatusEnum.BLOCKED;
      await this.seatRepository.save(seat);
    }
    
    return { zoneId, userId, removed: true, affectedSeats: seats.length };
  }

  async getOccupancyAnalytics(venueId: string, filters?: any) {
    const seats = await this.findAllSeats({ venueId });
    
    const totalSeats = seats.length;
    const availableSeats = seats.filter(s => s.status === SeatStatusEnum.AVAILABLE).length;
    const occupiedSeats = totalSeats - availableSeats;
    const occupancyRate = totalSeats > 0 ? (occupiedSeats / totalSeats) * 100 : 0;
    
    // Group by zone
    const zoneOccupancy = new Map();
    for (const seat of seats) {
      if (seat.zone) {
        const zoneId = seat.zone.id;
        if (!zoneOccupancy.has(zoneId)) {
          zoneOccupancy.set(zoneId, {
            zoneId: zoneId,
            zoneName: seat.zone.name || `Zone ${zoneId}`,
            totalSeats: 0,
            availableSeats: 0,
            occupiedSeats: 0,
          });
        }
        const zone = zoneOccupancy.get(zoneId);
        zone.totalSeats++;
        if (seat.status === SeatStatusEnum.AVAILABLE) {
          zone.availableSeats++;
        } else {
          zone.occupiedSeats++;
        }
      }
    }
    
    // Calculate occupancy rates for zones
    for (const zone of zoneOccupancy.values()) {
      zone.occupancyRate = zone.totalSeats > 0 ? (zone.occupiedSeats / zone.totalSeats) * 100 : 0;
    }
    
    return {
      venueId,
      totalSeats,
      availableSeats,
      occupiedSeats,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
      zoneOccupancy: Array.from(zoneOccupancy.values()),
    };
  }

  async getRevenueAnalytics(venueId: string, filters?: any) {
    const seats = await this.findAllSeats({ venueId });
    
    // In a real implementation, you would calculate revenue from actual sales
    // For now, calculate potential revenue based on seat pricing
    let totalPotentialRevenue = 0;
    let soldSeats = 0;
    
    for (const seat of seats) {
      if (seat.status !== SeatStatusEnum.AVAILABLE) {
        soldSeats++;
        // Get seat pricing
        const pricing = await this.getSeatPricing(seat.id);
        totalPotentialRevenue += pricing.pricing.finalPrice;
      }
    }
    
    // Group by seat type
    const revenueByType = new Map();
    for (const seat of seats) {
      if (seat.status !== SeatStatusEnum.AVAILABLE) {
        const pricing = await this.getSeatPricing(seat.id);
        const seatType = seat.seatType || SeatTypeEnum.STANDARD;
        
        if (!revenueByType.has(seatType)) {
          revenueByType.set(seatType, {
            seatType,
            seats: 0,
            revenue: 0,
          });
        }
        
        const typeStats = revenueByType.get(seatType);
        typeStats.seats++;
        typeStats.revenue += pricing.pricing.finalPrice;
      }
    }
    
    return {
      venueId,
      totalRevenue: Math.round(totalPotentialRevenue * 100) / 100,
      soldSeats,
      totalSeats: seats.length,
      revenueByType: Array.from(revenueByType.values()),
    };
  }
} 