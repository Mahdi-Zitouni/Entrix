import { IsString, IsOptional, IsNumber, IsUUID } from 'class-validator';

export class CreatePaymentAttemptDto {
  @IsUUID()
  paymentId: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  attemptNumber?: number;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  transactionNumber?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
