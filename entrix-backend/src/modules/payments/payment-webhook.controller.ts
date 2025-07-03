import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { PaymentWebhookService } from './payment-webhook.service';
import { CreatePaymentWebhookDto } from './dto/create-payment-webhook.dto';

@Controller('payment-webhooks')
export class PaymentWebhookController {
  constructor(private readonly paymentWebhookService: PaymentWebhookService) {}

  @Post()
  create(@Body() dto: CreatePaymentWebhookDto) {
    return this.paymentWebhookService.create(dto);
  }

  @Get()
  findAll() {
    return this.paymentWebhookService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentWebhookService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreatePaymentWebhookDto>,
  ) {
    return this.paymentWebhookService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paymentWebhookService.remove(id);
  }
}
