import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsObject,
  IsUUID,
  IsBoolean,
} from 'class-validator';

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsString()
  subscriptionNumber?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  subscriptionPlanId?: string;

  @IsOptional()
  @IsUUID()
  seatId?: string;

  @IsOptional()
  @IsNumber()
  pricePaid?: number;

  @IsOptional()
  @IsUUID()
  paymentId?: string;

  @IsOptional()
  @IsDateString()
  validFrom?: Date;

  @IsOptional()
  @IsDateString()
  validUntil?: Date;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  suspensionReason?: string;

  @IsOptional()
  @IsDateString()
  suspensionDate?: Date;

  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @IsOptional()
  @IsDateString()
  renewalDate?: Date;

  @IsOptional()
  @IsNumber()
  transfersUsed?: number;

  @IsOptional()
  @IsDateString()
  lastTransferDate?: Date;

  @IsOptional()
  @IsDateString()
  activationDate?: Date;

  @IsOptional()
  @IsDateString()
  cancellationDate?: Date;

  @IsOptional()
  @IsString()
  cancellationReason?: string;

  @IsOptional()
  @IsObject()
  metadata?: any;

  @IsOptional()
  @IsUUID()
  createdBy?: string;
}
