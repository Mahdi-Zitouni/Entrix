import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsDateString,
  IsObject,
} from 'class-validator';

export class CreateSubscriptionPlanDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  type: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  maxSubscribers?: number;

  @IsOptional()
  @IsNumber()
  currentSubscribers?: number;

  @IsDateString()
  validFrom: Date;

  @IsDateString()
  validUntil: Date;

  @IsOptional()
  @IsDateString()
  saleStartDate?: Date;

  @IsOptional()
  @IsDateString()
  saleEndDate?: Date;

  @IsOptional()
  @IsBoolean()
  transferable?: boolean;

  @IsOptional()
  @IsNumber()
  maxTransfers?: number;

  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @IsOptional()
  @IsBoolean()
  includesPlayoffs?: boolean;

  @IsOptional()
  @IsBoolean()
  priorityBooking?: boolean;

  @IsOptional()
  @IsObject()
  benefits?: any;

  @IsOptional()
  @IsObject()
  restrictions?: any;

  @IsOptional()
  @IsObject()
  metadata?: any;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
