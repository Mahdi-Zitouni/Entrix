import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { TicketTemplatesService } from './ticket-templates.service';
import { CreateTicketTemplateDto } from './dto/create-ticket-template.dto';

@Controller('ticket-templates')
export class TicketTemplatesController {
  constructor(
    private readonly ticketTemplatesService: TicketTemplatesService,
  ) {}

  @Post()
  create(@Body() dto: CreateTicketTemplateDto) {
    return this.ticketTemplatesService.create(dto);
  }

  @Get()
  findAll() {
    return this.ticketTemplatesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ticketTemplatesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateTicketTemplateDto>,
  ) {
    return this.ticketTemplatesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ticketTemplatesService.remove(id);
  }
}
