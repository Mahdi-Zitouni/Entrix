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
import { RefundService } from './refund.service';
import { CreateRefundDto } from './dto/create-refund.dto';
import { RefundStatus } from './refund.entity';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Refunds')
@Controller('refunds')
export class RefundController {
  constructor(private readonly refundService: RefundService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a refund (admin)' })
  create(@Body() dto: CreateRefundDto) {
    return this.refundService.create(dto);
  }

  @Post('/request')
  @ApiOperation({ summary: 'User-initiated refund request' })
  requestRefund(@Body() dto: CreateRefundDto) {
    // Always set status to PENDING for user requests
    return this.refundService.create({ ...dto, status: RefundStatus.PENDING });
  }

  @Patch(':id/approve')
  @Roles('admin')
  @ApiOperation({ summary: 'Approve a refund (admin)' })
  approve(@Param('id') id: string) {
    return this.refundService.update(id, { status: RefundStatus.APPROVED });
  }

  @Patch(':id/reject')
  @Roles('admin')
  @ApiOperation({ summary: 'Reject a refund (admin)' })
  reject(@Param('id') id: string) {
    return this.refundService.update(id, { status: RefundStatus.REJECTED });
  }

  @Get()
  findAll() {
    return this.refundService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.refundService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateRefundDto>) {
    return this.refundService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.refundService.remove(id);
  }

  @Get('/eligibility/:orderId')
  async checkRefundEligibility(@Param('orderId') orderId: string) {
    return this.refundService.checkRefundEligibility(orderId);
  }

  @Get('search')
  async search(
    @Query('status') status?: string,
    @Query('userId') userId?: string,
    @Query('orderId') orderId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.refundService.findByQuery({
      status,
      userId,
      orderId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }
}
