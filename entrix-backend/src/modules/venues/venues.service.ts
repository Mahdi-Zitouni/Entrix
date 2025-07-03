import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Venue } from './venue.entity';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { Event } from '../events/event.entity';
import { Ticket } from '../ticketing/ticket.entity';
import { AuditLogService } from '../security/audit-log.service';
import { ZoneMappingOverrideService } from './zone-mapping-override.service';

@Injectable()
export class VenuesService {
  private readonly logger = new Logger(VenuesService.name);
  constructor(
    @InjectRepository(Venue)
    private readonly venueRepository: Repository<Venue>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    private readonly dataSource: DataSource,
    private readonly auditLogService: AuditLogService,
    private readonly zoneMappingOverrideService: ZoneMappingOverrideService,
  ) {}

  async findAll(filters?: any): Promise<Venue[]> {
    if (!filters) {
      return this.venueRepository.find({
        relations: ['mappings', 'amenities', 'media'],
      });
    }
    const qb = this.venueRepository.createQueryBuilder('venue')
      .leftJoinAndSelect('venue.mappings', 'mappings')
      .leftJoinAndSelect('venue.amenities', 'amenities')
      .leftJoinAndSelect('venue.media', 'media');
    if (filters.city) qb.andWhere('venue.city = :city', { city: filters.city });
    if (filters.capacity) qb.andWhere('venue.capacity >= :capacity', { capacity: filters.capacity });
    if (filters.services && filters.services.length) qb.andWhere('venue.services && ARRAY[:...services]', { services: filters.services });
    if (filters.search) qb.andWhere('(venue.name ILIKE :search OR venue.description ILIKE :search)', { search: `%${filters.search}%` });
    if (filters.page && filters.limit) {
      qb.skip((filters.page - 1) * filters.limit).take(filters.limit);
    }
    return qb.getMany();
  }

  async findOne(id: string): Promise<Venue> {
    const venue = await this.venueRepository.findOne({
      where: { id },
      relations: ['mappings', 'amenities', 'media'],
    });
    if (!venue) throw new NotFoundException('Venue not found');
    return venue;
  }

  async create(createVenueDto: CreateVenueDto, requestedBy?: string): Promise<Venue> {
    const venue = this.venueRepository.create(createVenueDto);
    return this.venueRepository.save(venue);
  }

  async update(id: string, updateVenueDto: UpdateVenueDto, updatedBy?: string): Promise<Venue> {
    const venue = await this.findOne(id);
    Object.assign(venue, updateVenueDto);
    return this.venueRepository.save(venue);
  }

  async remove(id: string, removedBy?: string): Promise<void> {
    const venue = await this.findOne(id);
    await this.venueRepository.remove(venue);
  }

  // Venue utilization report
  async getUtilizationReport(venueId: string, filters?: any) {
    // Events held at this venue
    const events = await this.eventRepository.find({ where: { venueId } });
    const eventIds = events.map(e => e.id);
    // Attendance per event
    const attendanceByEvent = await Promise.all(
      eventIds.map(async (eventId) => {
        const count = await this.ticketRepository.count({ where: { eventId, bookingStatus: 'CONFIRMED' } });
        return { eventId, count };
      })
    );
    const totalAttendance = attendanceByEvent.reduce((sum, e) => sum + e.count, 0);
    const avgAttendance = events.length ? totalAttendance / events.length : 0;
    // Peak usage: day with most events
    const eventsByDate: Record<string, number> = {};
    for (const event of events) {
      const date = event.scheduledStart ? event.scheduledStart.toISOString().split('T')[0] : 'unknown';
      eventsByDate[date] = (eventsByDate[date] || 0) + 1;
    }
    const peakDate = Object.entries(eventsByDate).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    return {
      venueId,
      eventsHeld: events.length,
      avgAttendance,
      peakDate,
      attendanceByEvent,
    };
  }

  async getSeatMap(venueId: string) {
    // Get all mappings for the venue
    const mappingRepo = this.venueRepository.manager.getRepository('VenueMapping');
    const zoneRepo = this.venueRepository.manager.getRepository('VenueZone');
    const seatRepo = this.venueRepository.manager.getRepository('Seat');
    const mappings = await mappingRepo.find({ where: { venue: { id: venueId } } });
    const mappingIds = mappings.map((m: any) => m.id);
    const zones = await zoneRepo.find({ where: mappingIds.length ? mappingIds.map((id: string) => ({ mapping: { id } })) : {}, relations: ['parentZone', 'children', 'mapping'] });
    const seats = await seatRepo.find({ where: zones.length ? zones.map((z: any) => ({ zone: { id: z.id } })) : {} });
    // Build nested structure: mapping -> zones (tree) -> seats
    const zoneMap: Map<string, any> = new Map(zones.map(z => [z.id, { ...z, children: [], seats: [] }]));
    for (const seat of seats) {
      if (seat.zone && zoneMap.has(seat.zone.id)) {
        zoneMap.get(seat.zone.id).seats.push(seat);
      }
    }
    const roots: any[] = [];
    for (const zone of zones) {
      if (zone.parentZone && zone.parentZone.id) {
        const parent = zoneMap.get(zone.parentZone.id);
        if (parent) parent.children.push(zoneMap.get(zone.id));
      } else {
        roots.push(zoneMap.get(zone.id));
      }
    }
    return { mappings, zones: roots };
  }

  async setSeatMap(venueId: string, map: any, userId?: string) {
    // Validate for duplicate IDs and invalid relationships
    const zoneIdSet = new Set<string>();
    const seatIdSet = new Set<string>();
    function validateZones(nodes: any[], parentZoneId: string | null, path: string[] = []) {
      for (const node of nodes) {
        if (zoneIdSet.has(node.id)) {
          throw new Error(`Duplicate zone id found: ${node.id}`);
        }
        zoneIdSet.add(node.id);
        if (path.includes(node.id)) {
          throw new Error(`Cycle detected in zone hierarchy at id: ${node.id}`);
        }
        if (node.seats && node.seats.length) {
          for (const seat of node.seats) {
            if (seatIdSet.has(seat.id)) {
              throw new Error(`Duplicate seat id found: ${seat.id}`);
            }
            seatIdSet.add(seat.id);
          }
        }
        if (node.children && node.children.length) {
          validateZones(node.children, node.id, [...path, node.id]);
        }
      }
    }
    validateZones(map.zones || [], null);
    let result, errorMessage = undefined;
    const start = Date.now();
    try {
      result = await this.dataSource.transaction(async manager => {
        const mappingRepo = manager.getRepository('VenueMapping');
        const zoneRepo = manager.getRepository('VenueZone');
        const seatRepo = manager.getRepository('Seat');
        const mappings = await mappingRepo.find({ where: { venue: { id: venueId } } });
        const mappingIds = mappings.map((m: any) => m.id);
        const zones = await zoneRepo.find({ where: mappingIds.length ? mappingIds.map((id: string) => ({ mapping: { id } })) : {} });
        const seats = await seatRepo.find({ where: zones.length ? zones.map((z: any) => ({ zone: { id: z.id } })) : {} });
        const zoneIds = new Set<string>();
        const seatIds = new Set<string>();
        function walkZones(nodes: any[], parentZoneId: string | null, mappingId: string) {
          for (const node of nodes) {
            zoneIds.add(node.id);
            zoneRepo.save({
              id: node.id,
              mapping: { id: mappingId },
              parentZone: parentZoneId ? { id: parentZoneId } : null,
              name: node.name,
              code: node.code,
              description: node.description,
              level: node.level,
              displayOrder: node.displayOrder,
              zoneType: node.zoneType,
              category: node.category,
              capacity: node.capacity,
              hasSeats: node.hasSeats,
              seatLayout: node.seatLayout,
              details: node.details,
              notes: node.notes,
              isActive: node.isActive,
              metadata: node.metadata,
            });
            if (node.seats && node.seats.length) {
              for (const seat of node.seats) {
                seatIds.add(seat.id);
                seatRepo.save({
                  id: seat.id,
                  zone: { id: node.id },
                  reference: seat.reference,
                  label: seat.label,
                  row: seat.row,
                  number: seat.number,
                  section: seat.section,
                  seatType: seat.seatType,
                  status: seat.status,
                  coordinates: seat.coordinates,
                  metadata: seat.metadata,
                });
              }
            }
            if (node.children && node.children.length) {
              walkZones(node.children, node.id, mappingId);
            }
          }
        }
        for (const mapping of mappings) {
          const rootZones = (map.zones || []).filter((z: any) => z.mapping && z.mapping.id === mapping.id);
          walkZones(rootZones, null, mapping.id);
        }
        const toDeleteZones = zones.filter(z => !zoneIds.has(z.id));
        const toDeleteSeats = seats.filter(s => !seatIds.has(s.id));
        for (const z of toDeleteZones) await zoneRepo.remove(z);
        for (const s of toDeleteSeats) await seatRepo.remove(s);
        this.logger.log(`Updated zones: ${zoneIds.size}, seats: ${seatIds.size}, deleted zones: ${toDeleteZones.length}, deleted seats: ${toDeleteSeats.length}`);
        return {
          updatedZones: zoneIds.size,
          updatedSeats: seatIds.size,
          deletedZones: toDeleteZones.length,
          deletedSeats: toDeleteSeats.length,
        };
      });
    } catch (err) {
      errorMessage = err.message;
      throw err;
    } finally {
      await this.auditLogService.logAction({
        action: 'update-seat-map',
        entityType: 'Venue',
        entityId: venueId,
        userId,
        newValues: map,
        success: !errorMessage,
        errorMessage,
        durationMs: Date.now() - start,
      });
    }
    return result;
  }

  async getEffectiveSeatMap(venueId: string, eventId?: string, date?: Date) {
    // Get the base seat/zone map
    const map = await this.getSeatMap(venueId);
    // Get all active overrides for this venue/event/date
    const overrides = [];
    if (eventId) {
      const override = await this.zoneMappingOverrideService.getActiveOverride({ eventId, venueId, date });
      if (override) overrides.push(override);
    } else {
      const override = await this.zoneMappingOverrideService.getActiveOverride({ venueId, date });
      if (override) overrides.push(override);
    }
    // Apply overrides to the map
    function applyOverridesToMap(map: any, overrides: any[]) {
      for (const override of overrides) {
        if (override.overrideType === 'VENUE' && map) {
          Object.assign(map, override.overrideData);
        }
        if (override.overrideType === 'ZONE' && map.zones) {
          for (const zone of map.zones) {
            if (zone.id === override.zone?.id) {
              Object.assign(zone, override.overrideData);
            }
          }
        }
        if (override.overrideType === 'SEAT' && map.zones) {
          for (const zone of map.zones) {
            if (zone.seats) {
              for (const seat of zone.seats) {
                if (seat.id === override.seat?.id) {
                  Object.assign(seat, override.overrideData);
                }
              }
            }
          }
        }
      }
    }
    applyOverridesToMap(map, overrides);
    return map;
  }

  // --- Controller contract implementations below ---

  async searchVenues(query: string, filters?: any): Promise<Venue[]> {
    const queryBuilder = this.venueRepository.createQueryBuilder('venue')
      .leftJoinAndSelect('venue.media', 'media')
      .leftJoinAndSelect('venue.mappings', 'mappings')
      .where('venue.isActive = :isActive', { isActive: true });

    if (query) {
      queryBuilder.andWhere(
        '(venue.name ILIKE :query OR venue.description ILIKE :query OR venue.address ILIKE :query OR venue.city ILIKE :query)',
        { query: `%${query}%` }
      );
    }

    if (filters?.city) {
      queryBuilder.andWhere('venue.city = :city', { city: filters.city });
    }

    if (filters?.capacity) {
      queryBuilder.andWhere('venue.maxCapacity >= :capacity', { capacity: filters.capacity });
    }

    if (filters?.venueType) {
      queryBuilder.andWhere('venue.venueType = :venueType', { venueType: filters.venueType });
    }

    return queryBuilder
      .orderBy('venue.name', 'ASC')
      .getMany();
  }

  async findNearbyVenues(lat: number, lng: number, radius: number = 50): Promise<Venue[]> {
    // Using PostgreSQL's ST_DWithin for geospatial search
    const queryBuilder = this.venueRepository.createQueryBuilder('venue')
      .leftJoinAndSelect('venue.media', 'media')
      .where('venue.isActive = :isActive', { isActive: true })
      .andWhere(
        'ST_DWithin(venue.coordinates, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326), :radius)',
        { lat, lng, radius: radius * 1000 } // Convert km to meters
      )
      .orderBy('ST_Distance(venue.coordinates, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326))', 'ASC');

    return queryBuilder.getMany();
  }

  async checkAvailability(id: string, from: Date, to: Date): Promise<any> {
    const venue = await this.findOne(id);
    if (!venue) {
      throw new Error('Venue not found');
    }

    // Check for conflicting events
    const conflictingEvents = await this.eventRepository.createQueryBuilder('event')
      .where('event.venueId = :venueId', { venueId: id })
      .andWhere('event.isActive = :isActive', { isActive: true })
      .andWhere(
        '(event.scheduledStart <= :to AND event.scheduledEnd >= :from)',
        { from, to }
      )
      .getMany();

    const isAvailable = conflictingEvents.length === 0;
    const conflicts = conflictingEvents.map(event => ({
      id: event.id,
      name: event.name,
      scheduledStart: event.scheduledStart,
      scheduledEnd: event.scheduledEnd,
    }));

    return {
      id,
      available: isAvailable,
      from,
      to,
      conflicts,
      venue: {
        id: venue.id,
        name: venue.name,
        maxCapacity: venue.maxCapacity,
      },
    };
  }

  async getCapacityInfo(id: string): Promise<any> {
    const venue = await this.findOne(id);
    if (!venue) {
      throw new Error('Venue not found');
    }

    // Get seat map to calculate actual capacity
    const seatMap = await this.getSeatMap(id);
    let totalSeats = 0;
    let availableSeats = 0;

    if (seatMap && seatMap.zones) {
      for (const zone of seatMap.zones) {
        if (zone.seats) {
          for (const seat of zone.seats) {
            totalSeats++;
            if (seat.status === 'available') {
              availableSeats++;
            }
          }
        }
      }
    }

    return {
      id,
      name: venue.name,
      maxCapacity: venue.maxCapacity,
      totalSeats,
      availableSeats,
      utilizationRate: totalSeats > 0 ? ((totalSeats - availableSeats) / totalSeats) * 100 : 0,
      seatMap: seatMap ? { zones: seatMap.zones?.length || 0 } : null,
    };
  }

  async getVenueServices(id: string): Promise<any> {
    const venue = await this.findOne(id);
    if (!venue) {
      throw new Error('Venue not found');
    }

    // In a real implementation, you would have a separate venue_services table
    // For now, return services based on venue metadata and global services
    const services = [];
    
    if (venue.globalServices && venue.globalServices.includes('stadium')) {
      services.push(
        { id: 'parking', name: 'Parking', available: true },
        { id: 'concessions', name: 'Food & Beverage', available: true },
        { id: 'accessibility', name: 'Accessibility Services', available: true },
        { id: 'security', name: 'Security Services', available: true }
      );
    } else if (venue.globalServices && venue.globalServices.includes('theater')) {
      services.push(
        { id: 'parking', name: 'Parking', available: true },
        { id: 'concessions', name: 'Food & Beverage', available: true },
        { id: 'accessibility', name: 'Accessibility Services', available: true }
      );
    }

    return {
      id,
      name: venue.name,
      services,
    };
  }

  async getVenueMedia(id: string): Promise<any> {
    const venue = await this.findOne(id);
    if (!venue) {
      throw new Error('Venue not found');
    }

    return {
      id,
      name: venue.name,
      media: venue.media || [],
    };
  }

  async getVenueMappings(id: string): Promise<any> {
    const venue = await this.findOne(id);
    if (!venue) {
      throw new Error('Venue not found');
    }

    return {
      id,
      name: venue.name,
      mappings: venue.mappings || [],
    };
  }

  async getVenueZones(id: string, mappingId?: string): Promise<any> {
    const venue = await this.findOne(id);
    if (!venue) {
      throw new Error('Venue not found');
    }

    const seatMap = await this.getSeatMap(id);
    let zones = [];

    if (seatMap && seatMap.zones) {
      zones = mappingId 
        ? seatMap.zones.filter((zone: any) => zone.mapping?.id === mappingId)
        : seatMap.zones;
    }

    return {
      id,
      name: venue.name,
      mappingId,
      zones,
      totalZones: zones.length,
    };
  }

  async getAccessPoints(id: string): Promise<any> {
    const venue = await this.findOne(id);
    if (!venue) {
      throw new Error('Venue not found');
    }

    // In a real implementation, you would have a separate access_points table
    // For now, return mock access points based on venue metadata
    const accessPoints = [];
    
    if (venue.globalServices && venue.globalServices.includes('stadium')) {
      accessPoints.push(
        { id: 'main-gate', name: 'Main Gate', type: 'entrance', status: 'active' },
        { id: 'vip-entrance', name: 'VIP Entrance', type: 'entrance', status: 'active' },
        { id: 'emergency-exit-1', name: 'Emergency Exit 1', type: 'exit', status: 'active' },
        { id: 'emergency-exit-2', name: 'Emergency Exit 2', type: 'exit', status: 'active' }
      );
    } else if (venue.globalServices && venue.globalServices.includes('theater')) {
      accessPoints.push(
        { id: 'main-entrance', name: 'Main Entrance', type: 'entrance', status: 'active' },
        { id: 'stage-door', name: 'Stage Door', type: 'entrance', status: 'active' },
        { id: 'emergency-exit', name: 'Emergency Exit', type: 'exit', status: 'active' }
      );
    }

    return {
      id,
      name: venue.name,
      accessPoints,
    };
  }

  async uploadMedia(id: string, file: any, body: any): Promise<any> {
    const venue = await this.findOne(id);
    if (!venue) {
      throw new Error('Venue not found');
    }

    // In a real implementation, you would upload the file to cloud storage
    const mediaUrl = `https://storage.example.com/venues/${id}/${file.originalname}`;
    
    // Create a new media object (not using the entity directly)
    const media = {
      id: `media_${Date.now()}`,
      url: mediaUrl,
      type: file.mimetype,
      name: body.name || file.originalname,
      description: body.description,
      uploadedAt: new Date(),
      uploadedBy: body.uploadedBy,
    };

    // Add to venue images array instead of media
    if (!venue.images) {
      venue.images = [];
    }
    venue.images.push(mediaUrl);
    await this.venueRepository.save(venue);

    return {
      id,
      media,
      message: 'Media uploaded successfully',
    };
  }

  async createMapping(id: string, mappingData: any): Promise<any> {
    const venue = await this.findOne(id);
    if (!venue) {
      throw new Error('Venue not found');
    }

    // Create a new mapping object (not using the entity directly)
    const mapping = {
      id: `mapping_${Date.now()}`,
      name: mappingData.name,
      description: mappingData.description,
      isActive: true,
      createdAt: new Date(),
      createdBy: mappingData.createdBy,
    };

    // In a real implementation, you would save this to the mappings table
    // For now, just return the mapping object
    return {
      id,
      mapping,
      message: 'Mapping created successfully',
    };
  }

  async createZone(id: string, zoneData: any): Promise<any> {
    const venue = await this.findOne(id);
    if (!venue) {
      throw new Error('Venue not found');
    }

    const zone = {
      id: `zone_${Date.now()}`,
      name: zoneData.name,
      description: zoneData.description,
      capacity: zoneData.capacity,
      parentZoneId: zoneData.parentZoneId,
      mappingId: zoneData.mappingId,
      isActive: true,
      createdAt: new Date(),
      createdBy: zoneData.createdBy,
    };

    // In a real implementation, you would save this to a zones table
    // For now, we'll add it to the seat map
    const seatMap = await this.getSeatMap(id);
    if (!seatMap.zones) {
      seatMap.zones = [];
    }
    seatMap.zones.push(zone);
    await this.setSeatMap(id, seatMap, zoneData.createdBy);

    return {
      id,
      zone,
      message: 'Zone created successfully',
    };
  }

  async createAccessPoint(id: string, accessPointData: any): Promise<any> {
    const venue = await this.findOne(id);
    if (!venue) {
      throw new Error('Venue not found');
    }

    const accessPoint = {
      id: `access_${Date.now()}`,
      name: accessPointData.name,
      type: accessPointData.type, // entrance, exit, emergency
      location: accessPointData.location,
      status: 'active',
      createdAt: new Date(),
      createdBy: accessPointData.createdBy,
    };

    // In a real implementation, you would save this to an access_points table
    return {
      id,
      accessPoint,
      message: 'Access point created successfully',
    };
  }

  async updateStatus(id: string, isActive: boolean, reason?: string, updatedBy?: string): Promise<any> {
    const venue = await this.findOne(id);
    if (!venue) {
      throw new Error('Venue not found');
    }

    venue.isActive = isActive;
    venue.updatedAt = new Date();

    await this.venueRepository.save(venue);

    // Log the status change
    await this.auditLogService.logAction({
      action: 'update-venue-status',
      entityType: 'Venue',
      entityId: id,
      userId: updatedBy,
      oldValues: { isActive: !isActive },
      newValues: { isActive, reason },
      success: true,
    });

    return {
      id,
      isActive,
      reason,
      updatedBy,
      message: `Venue ${isActive ? 'activated' : 'deactivated'} successfully`,
    };
  }

  async updateCapacity(id: string, maxCapacity: number, reason?: string, updatedBy?: string): Promise<any> {
    const venue = await this.findOne(id);
    if (!venue) {
      throw new Error('Venue not found');
    }

    const oldCapacity = venue.maxCapacity;
    venue.maxCapacity = maxCapacity;
    venue.updatedAt = new Date();

    await this.venueRepository.save(venue);

    // Log the capacity change
    await this.auditLogService.logAction({
      action: 'update-venue-capacity',
      entityType: 'Venue',
      entityId: id,
      userId: updatedBy,
      oldValues: { maxCapacity: oldCapacity },
      newValues: { maxCapacity, reason },
      success: true,
    });

    return {
      id,
      maxCapacity,
      reason,
      updatedBy,
      message: 'Venue capacity updated successfully',
    };
  }

  async removeMedia(id: string, mediaId: string): Promise<any> {
    const venue = await this.findOne(id);
    if (!venue) {
      throw new Error('Venue not found');
    }

    if (!venue.media) {
      throw new Error('No media found for this venue');
    }

    const mediaIndex = venue.media.findIndex(m => m.id === mediaId);
    if (mediaIndex === -1) {
      throw new Error('Media not found');
    }

    const removedMedia = venue.media.splice(mediaIndex, 1)[0];
    await this.venueRepository.save(venue);

    return {
      id,
      mediaId,
      removed: true,
      message: 'Media removed successfully',
    };
  }

  async removeMapping(id: string, mappingId: string): Promise<any> {
    const venue = await this.findOne(id);
    if (!venue) {
      throw new Error('Venue not found');
    }

    if (!venue.mappings) {
      throw new Error('No mappings found for this venue');
    }

    const mappingIndex = venue.mappings.findIndex(m => m.id === mappingId);
    if (mappingIndex === -1) {
      throw new Error('Mapping not found');
    }

    const removedMapping = venue.mappings.splice(mappingIndex, 1)[0];
    await this.venueRepository.save(venue);

    return {
      id,
      mappingId,
      removed: true,
      message: 'Mapping removed successfully',
    };
  }

  async getAnalyticsOverview(filters?: any): Promise<any> {
    const totalVenues = await this.venueRepository.count({ where: { isActive: true } });
    
    // Calculate average utilization
    const venues = await this.venueRepository.find({ where: { isActive: true } });
    let totalUtilization = 0;
    let venuesWithEvents = 0;

    for (const venue of venues) {
      const events = await this.eventRepository.count({
        where: { venueId: venue.id, isActive: true }
      });
      
      if (events > 0) {
        venuesWithEvents++;
        // Simple utilization calculation based on events
        totalUtilization += Math.min(events * 10, 100); // Assume 10% utilization per event, max 100%
      }
    }

    const averageUtilization = venuesWithEvents > 0 ? totalUtilization / venuesWithEvents : 0;

    return {
      totalVenues,
      activeVenues: totalVenues,
      venuesWithEvents,
      averageUtilization: Math.round(averageUtilization * 100) / 100,
      topVenues: await this.getTopVenues(5),
    };
  }

  async getUtilizationAnalytics(period: string, filters?: any): Promise<any> {
    const venues = await this.venueRepository.find({ where: { isActive: true } });
    const utilizationData = [];

    for (const venue of venues) {
      const events = await this.eventRepository.find({
        where: { venueId: venue.id, isActive: true },
        order: { scheduledStart: 'ASC' }
      });

      let utilization = 0;
      if (events.length > 0) {
        // Calculate utilization based on events in the period
        const periodStart = this.getPeriodStart(period);
        const periodEvents = events.filter(event => event.scheduledStart >= periodStart);
        utilization = periodEvents.length > 0 ? Math.min(periodEvents.length * 15, 100) : 0;
      }

      utilizationData.push({
        venueId: venue.id,
        venueName: venue.name,
        utilization,
        events: events.length,
      });
    }

    return {
      period,
      totalVenues: venues.length,
      averageUtilization: utilizationData.reduce((sum, v) => sum + v.utilization, 0) / venues.length,
      utilizationData: utilizationData.sort((a, b) => b.utilization - a.utilization),
    };
  }

  private async getTopVenues(limit: number): Promise<any[]> {
    const venues = await this.venueRepository.find({ where: { isActive: true } });
    const venueStats = [];

    for (const venue of venues) {
      const events = await this.eventRepository.count({
        where: { venueId: venue.id, isActive: true }
      });
      
      venueStats.push({
        id: venue.id,
        name: venue.name,
        events,
        utilization: Math.min(events * 10, 100),
      });
    }

    return venueStats
      .sort((a, b) => b.events - a.events)
      .slice(0, limit);
  }

  private getPeriodStart(period: string): Date {
    const now = new Date();
    switch (period) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      case 'quarter':
        return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      case 'year':
        return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days
    }
  }
}
