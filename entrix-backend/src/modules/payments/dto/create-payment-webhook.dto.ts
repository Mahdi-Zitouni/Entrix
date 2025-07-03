import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreatePaymentWebhookDto {
  @IsUUID()
  paymentId: string;

  @IsString()
  webhookId: string;

  @IsString()
  eventType: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  externalTransactionId?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
