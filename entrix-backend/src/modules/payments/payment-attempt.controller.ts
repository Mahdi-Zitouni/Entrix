import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { PaymentAttemptService } from './payment-attempt.service';
import { CreatePaymentAttemptDto } from './dto/create-payment-attempt.dto';

@Controller('payment-attempts')
export class PaymentAttemptController {
  constructor(private readonly paymentAttemptService: PaymentAttemptService) {}

  @Post()
  create(@Body() dto: CreatePaymentAttemptDto) {
    return this.paymentAttemptService.create(dto);
  }

  @Get()
  findAll() {
    return this.paymentAttemptService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentAttemptService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreatePaymentAttemptDto>,
  ) {
    return this.paymentAttemptService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paymentAttemptService.remove(id);
  }
}
