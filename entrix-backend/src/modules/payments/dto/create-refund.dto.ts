import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  IsDate,
} from 'class-validator';

export class CreateRefundDto {
  @IsUUID()
  paymentId: string;

  @IsUUID()
  orderId: string;

  @IsString()
  refundNumber: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  requestedBy?: string;

  @IsOptional()
  @IsString()
  approvedBy?: string;

  @IsOptional()
  @IsDate()
  requestedAt?: Date;

  @IsOptional()
  @IsDate()
  approvedAt?: Date;

  @IsOptional()
  metadata?: Record<string, any>;
}
