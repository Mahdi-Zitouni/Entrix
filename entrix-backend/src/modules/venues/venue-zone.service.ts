import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VenueZone } from './venue-zone.entity';

@Injectable()
export class VenueZoneService {
  constructor(
    @InjectRepository(VenueZone)
    private readonly zoneRepository: Repository<VenueZone>,
  ) {}

  async createZone(dto: Partial<VenueZone>): Promise<VenueZone> {
    const zone = this.zoneRepository.create(dto);
    return this.zoneRepository.save(zone);
  }

  async findAllZones(): Promise<VenueZone[]> {
    return this.zoneRepository.find();
  }

  async findZoneById(id: string): Promise<VenueZone> {
    const zone = await this.zoneRepository.findOne({ where: { id } });
    if (!zone) throw new NotFoundException('Zone not found');
    return zone;
  }

  async updateZone(id: string, dto: Partial<VenueZone>): Promise<VenueZone> {
    const zone = await this.findZoneById(id);
    Object.assign(zone, dto);
    return this.zoneRepository.save(zone);
  }

  async removeZone(id: string): Promise<void> {
    const zone = await this.findZoneById(id);
    await this.zoneRepository.remove(zone);
  }

  async getZoneHierarchy(venueId: string) {
    // Get all mappings for the venue
    const mappings = await this.zoneRepository.manager.getRepository('VenueMapping').find({ where: { venue: { id: venueId } } });
    const mappingIds = mappings.map((m: any) => m.id);
    // Get all zones for these mappings
    const zones: VenueZone[] = await this.zoneRepository.find({ where: mappingIds.length ? mappingIds.map((id: string) => ({ mapping: { id } })) : {}, relations: ['parentZone', 'children', 'mapping'] });
    // Build tree
    const zoneMap: Map<string, any> = new Map(zones.map(z => [z.id, { ...z, children: [] }]));
    const roots: any[] = [];
    for (const zone of zones) {
      if (zone.parentZone && zone.parentZone.id) {
        const parent = zoneMap.get(zone.parentZone.id);
        if (parent) parent.children.push(zoneMap.get(zone.id));
      } else {
        roots.push(zoneMap.get(zone.id));
      }
    }
    return roots;
  }

  async setZoneHierarchy(venueId: string, tree: any[]) {
    // Flatten tree and update parentZone for each
    const updates: { id: string; parentZone: string | null }[] = [];
    function walk(nodes: any[], parentId: string | null) {
      for (const node of nodes) {
        updates.push({ id: node.id, parentZone: parentId });
        if (node.children && node.children.length) {
          walk(node.children, node.id);
        }
      }
    }
    walk(tree, null);
    for (const upd of updates) {
      await this.zoneRepository.update(upd.id, { parentZone: upd.parentZone ? { id: upd.parentZone } : undefined });
    }
    return { updated: updates.length };
  }
} 