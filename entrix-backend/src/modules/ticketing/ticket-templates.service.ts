import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketTemplates } from './ticket-templates.entity';
import { CreateTicketTemplateDto } from './dto/create-ticket-template.dto';

@Injectable()
export class TicketTemplatesService {
  constructor(
    @InjectRepository(TicketTemplates)
    private readonly ticketTemplatesRepository: Repository<TicketTemplates>,
  ) {}

  create(dto: CreateTicketTemplateDto) {
    const entity = this.ticketTemplatesRepository.create(dto);
    return this.ticketTemplatesRepository.save(entity);
  }

  findAll() {
    return this.ticketTemplatesRepository.find();
  }

  findOne(id: string) {
    return this.ticketTemplatesRepository.findOne({ where: { id } });
  }

  update(id: string, dto: Partial<CreateTicketTemplateDto>) {
    return this.ticketTemplatesRepository.update(id, dto);
  }

  remove(id: string) {
    return this.ticketTemplatesRepository.delete(id);
  }
}
