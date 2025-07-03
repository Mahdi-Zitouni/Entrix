import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClubCommission } from './club-commission.entity';
import { CreateClubCommissionDto } from './dto/create-club-commission.dto';

@Injectable()
export class ClubCommissionService {
  constructor(
    @InjectRepository(ClubCommission)
    private readonly clubCommissionRepository: Repository<ClubCommission>,
  ) {}

  create(dto: CreateClubCommissionDto) {
    const entity = this.clubCommissionRepository.create(dto);
    return this.clubCommissionRepository.save(entity);
  }

  findAll() {
    return this.clubCommissionRepository.find();
  }

  findOne(id: string) {
    return this.clubCommissionRepository.findOne({ where: { id } });
  }

  update(id: string, dto: Partial<CreateClubCommissionDto>) {
    return this.clubCommissionRepository.update(id, dto);
  }

  remove(id: string) {
    return this.clubCommissionRepository.delete(id);
  }

  // Advanced commission reporting: aggregate by club, status, and date
  async getCommissionReport({
    clubId,
    status,
    from,
    to,
  }: {
    clubId?: string;
    status?: string;
    from?: Date;
    to?: Date;
  }) {
    const qb = this.clubCommissionRepository
      .createQueryBuilder('cc')
      .select('cc.clubId', 'clubId')
      .addSelect('SUM(cc.amount)', 'totalCommission')
      .addSelect('cc.status', 'status')
      .groupBy('cc.clubId')
      .addGroupBy('cc.status');
    if (clubId) qb.andWhere('cc.clubId = :clubId', { clubId });
    if (status) qb.andWhere('cc.status = :status', { status });
    if (from) qb.andWhere('cc.createdAt >= :from', { from });
    if (to) qb.andWhere('cc.createdAt <= :to', { to });
    return qb.getRawMany();
  }
}
