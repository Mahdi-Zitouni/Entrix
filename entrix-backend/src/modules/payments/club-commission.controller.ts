import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { ClubCommissionService } from './club-commission.service';
import { CreateClubCommissionDto } from './dto/create-club-commission.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('ClubCommissions')
@Controller('club-commissions')
export class ClubCommissionController {
  constructor(private readonly clubCommissionService: ClubCommissionService) {}

  @Post()
  create(@Body() dto: CreateClubCommissionDto) {
    return this.clubCommissionService.create(dto);
  }

  @Get()
  findAll() {
    return this.clubCommissionService.findAll();
  }

  @Get('report')
  @ApiOperation({
    summary: 'Get advanced commission report (aggregate by club, status, date)',
  })
  getCommissionReport(
    @Query('clubId') clubId?: string,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.clubCommissionService.getCommissionReport({
      clubId,
      status,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clubCommissionService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateClubCommissionDto>,
  ) {
    return this.clubCommissionService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.clubCommissionService.remove(id);
  }
}
