import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { AccessTransactionsLogService } from './access-transactions-log.service';
import { CreateAccessTransactionsLogDto } from './dto/create-access-transactions-log.dto';

@Controller('access-transactions-log')
export class AccessTransactionsLogController {
  constructor(
    private readonly accessTransactionsLogService: AccessTransactionsLogService,
  ) {}

  @Post()
  create(@Body() dto: CreateAccessTransactionsLogDto) {
    return this.accessTransactionsLogService.create(dto);
  }

  @Get()
  findAll() {
    return this.accessTransactionsLogService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accessTransactionsLogService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateAccessTransactionsLogDto>,
  ) {
    return this.accessTransactionsLogService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accessTransactionsLogService.remove(id);
  }
}
