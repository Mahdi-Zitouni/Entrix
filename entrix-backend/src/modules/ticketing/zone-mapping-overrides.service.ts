import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ZoneMappingOverrides } from './zone-mapping-overrides.entity';
import { CreateZoneMappingOverridesDto } from './dto/create-zone-mapping-overrides.dto';

@Injectable()
export class ZoneMappingOverridesService {
  constructor(
    @InjectRepository(ZoneMappingOverrides)
    private readonly zoneMappingOverridesRepository: Repository<ZoneMappingOverrides>,
  ) {}

  create(dto: CreateZoneMappingOverridesDto) {
    const entity = this.zoneMappingOverridesRepository.create(dto);
    return this.zoneMappingOverridesRepository.save(entity);
  }

  findAll() {
    return this.zoneMappingOverridesRepository.find();
  }

  findOne(id: string) {
    return this.zoneMappingOverridesRepository.findOne({ where: { id } });
  }

  update(id: string, dto: Partial<CreateZoneMappingOverridesDto>) {
    return this.zoneMappingOverridesRepository.update(id, dto);
  }

  remove(id: string) {
    return this.zoneMappingOverridesRepository.delete(id);
  }
}
