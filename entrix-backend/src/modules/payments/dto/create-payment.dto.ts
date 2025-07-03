import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  IsDate,
} from 'class-validator';

export class CreatePaymentDto {
  @IsUUID()
  orderId: string;

  @IsOptional()
  @IsUUID()
  paymentMethodId?: string;

  @IsString()
  paymentNumber: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  transactionNumber?: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsNumber()
  processingFee?: number;

  @IsOptional()
  @IsNumber()
  refundedAmount?: number;

  @IsOptional()
  @IsString()
  externalTransactionId?: string;

  @IsOptional()
  @IsString()
  externalReference?: string;

  @IsOptional()
  @IsDate()
  paymentDate?: Date;

  @IsOptional()
  @IsDate()
  expiresAt?: Date;

  @IsOptional()
  metadata?: Record<string, any>;
}
