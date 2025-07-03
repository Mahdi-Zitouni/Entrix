import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  IsDate,
} from 'class-validator';

export class CreateOrderDto {
  @IsString()
  orderNumber: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  guestEmail?: string;

  @IsOptional()
  @IsString()
  guestPhone?: string;

  @IsOptional()
  @IsString()
  guestName?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsNumber()
  totalAmount: number;

  @IsNumber()
  subtotalAmount: number;

  @IsOptional()
  @IsNumber()
  discountAmount?: number;

  @IsOptional()
  @IsNumber()
  taxAmount?: number;

  @IsOptional()
  @IsNumber()
  processingFee?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsUUID()
  paymentMethodId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  paymentProofFile?: string;

  @IsOptional()
  @IsString()
  transactionNumber?: string;

  @IsOptional()
  @IsDate()
  expiresAt?: Date;

  @IsOptional()
  @IsString()
  purchaseChannel?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsString()
  referrer?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsDate()
  confirmedAt?: Date;

  @IsOptional()
  @IsDate()
  cancelledAt?: Date;

  @IsOptional()
  @IsString()
  cancellationReason?: string;
}
