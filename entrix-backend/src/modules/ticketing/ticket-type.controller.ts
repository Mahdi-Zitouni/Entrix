import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { TicketTypeService } from './ticket-type.service';
import { CreateTicketTypeDto } from './dto/create-ticket-type.dto';
import { UpdateTicketTypeDto } from './dto/update-ticket-type.dto';

@Controller('ticket-types')
export class TicketTypeController {
  constructor(private readonly ticketTypeService: TicketTypeService) {}

  @Get()
  async findAll() {
    return this.ticketTypeService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.ticketTypeService.findOne(id);
  }

  @Post()
  async create(@Body() createDto: CreateTicketTypeDto) {
    return this.ticketTypeService.create(createDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateTicketTypeDto,
  ) {
    return this.ticketTypeService.update(id, updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.ticketTypeService.remove(id);
    return { message: 'Ticket type deleted successfully' };
  }
}
