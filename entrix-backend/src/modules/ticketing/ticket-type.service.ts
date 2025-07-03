import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketType } from './ticket-type.entity';
import { CreateTicketTypeDto } from './dto/create-ticket-type.dto';
import { UpdateTicketTypeDto } from './dto/update-ticket-type.dto';

@Injectable()
export class TicketTypeService {
  constructor(
    @InjectRepository(TicketType)
    private readonly ticketTypeRepository: Repository<TicketType>,
  ) {}

  async findAll(): Promise<TicketType[]> {
    return this.ticketTypeRepository.find();
  }

  async findOne(id: string): Promise<TicketType> {
    const type = await this.ticketTypeRepository.findOne({ where: { id } });
    if (!type) throw new NotFoundException('Ticket type not found');
    return type;
  }

  async create(createDto: CreateTicketTypeDto): Promise<TicketType> {
    const type = this.ticketTypeRepository.create(createDto);
    return this.ticketTypeRepository.save(type);
  }

  async update(
    id: string,
    updateDto: UpdateTicketTypeDto,
  ): Promise<TicketType> {
    const type = await this.findOne(id);
    Object.assign(type, updateDto);
    return this.ticketTypeRepository.save(type);
  }

  async remove(id: string): Promise<void> {
    const type = await this.findOne(id);
    await this.ticketTypeRepository.remove(type);
  }
}
