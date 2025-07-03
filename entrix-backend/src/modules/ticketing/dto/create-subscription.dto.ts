import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  IsObject,
  IsUUID,
  IsBoolean,
} from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  subscriptionNumber: string;

  @IsUUID()
  userId: string;

  @IsUUID()
  subscriptionPlanId: string;

  @IsOptional()
  @IsUUID()
  seatId?: string;

  @IsNumber()
  pricePaid: number;

  @IsOptional()
  @IsUUID()
  paymentId?: string;

  @IsDateString()
  validFrom: Date;

  @IsDateString()
  validUntil: Date;

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
