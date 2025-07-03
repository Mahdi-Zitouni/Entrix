import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccessTransactionsLog } from './access-transactions-log.entity';
import { CreateAccessTransactionsLogDto } from './dto/create-access-transactions-log.dto';

@Injectable()
export class AccessTransactionsLogService {
  constructor(
    @InjectRepository(AccessTransactionsLog)
    private readonly accessTransactionsLogRepository: Repository<AccessTransactionsLog>,
  ) {}

  create(dto: CreateAccessTransactionsLogDto) {
    const entity = this.accessTransactionsLogRepository.create(dto);
    return this.accessTransactionsLogRepository.save(entity);
  }

  findAll() {
    return this.accessTransactionsLogRepository.find();
  }

  findOne(id: string) {
    return this.accessTransactionsLogRepository.findOne({ where: { id } });
  }

  update(id: string, dto: Partial<CreateAccessTransactionsLogDto>) {
    return this.accessTransactionsLogRepository.update(id, dto);
  }

  remove(id: string) {
    return this.accessTransactionsLogRepository.delete(id);
  }
}
