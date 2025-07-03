import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { AccessControlLogService } from './access-control-log.service';
import { CreateAccessControlLogDto } from './dto/create-access-control-log.dto';

@Controller('access-control-log')
export class AccessControlLogController {
  constructor(
    private readonly accessControlLogService: AccessControlLogService,
  ) {}

  @Post()
  create(@Body() dto: CreateAccessControlLogDto) {
    return this.accessControlLogService.create(dto);
  }

  @Get()
  findAll() {
    return this.accessControlLogService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accessControlLogService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateAccessControlLogDto>,
  ) {
    return this.accessControlLogService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accessControlLogService.remove(id);
  }
}
