import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentWebhook } from './payment-webhook.entity';
import { CreatePaymentWebhookDto } from './dto/create-payment-webhook.dto';

@Injectable()
export class PaymentWebhookService {
  constructor(
    @InjectRepository(PaymentWebhook)
    private readonly paymentWebhookRepository: Repository<PaymentWebhook>,
  ) {}

  create(dto: CreatePaymentWebhookDto) {
    const entity = this.paymentWebhookRepository.create(dto);
    return this.paymentWebhookRepository.save(entity);
  }

  findAll() {
    return this.paymentWebhookRepository.find();
  }

  findOne(id: string) {
    return this.paymentWebhookRepository.findOne({ where: { id } });
  }

  update(id: string, dto: Partial<CreatePaymentWebhookDto>) {
    return this.paymentWebhookRepository.update(id, dto);
  }

  remove(id: string) {
    return this.paymentWebhookRepository.delete(id);
  }

  async handleWebhook(dto: CreatePaymentWebhookDto, processFn: (dto: CreatePaymentWebhookDto) => Promise<void>) {
    let webhook = await this.paymentWebhookRepository.findOne({ where: { webhookId: dto.webhookId } });
    if (!webhook) {
      webhook = this.paymentWebhookRepository.create(dto);
      await this.paymentWebhookRepository.save(webhook);
    }
    try {
      await processFn(dto);
      webhook.status = 'PROCESSED';
      webhook.errorMessage = undefined;
    } catch (err) {
      webhook.status = 'FAILED';
      webhook.errorMessage = err.message;
      webhook.retryCount = (webhook.retryCount || 0) + 1;
    }
    await this.paymentWebhookRepository.save(webhook);
    return webhook;
  }

  async retryWebhook(id: string, processFn: (dto: CreatePaymentWebhookDto) => Promise<void>) {
    const webhook = await this.paymentWebhookRepository.findOne({ where: { id } });
    if (!webhook) throw new Error('Webhook not found');
    return this.handleWebhook({
      webhookId: webhook.webhookId,
      paymentId: webhook.payment?.id,
      eventType: webhook.eventType,
      status: webhook.status,
      externalTransactionId: webhook.externalTransactionId,
      metadata: webhook.metadata,
    }, processFn);
  }
}
