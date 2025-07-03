import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsUUID,
  IsObject,
} from 'class-validator';

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  shortTitle?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  visibility?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  groupId?: string;

  @IsOptional()
  @IsUUID()
  parentEventId?: string;

  @IsOptional()
  @IsString()
  venueId?: string;

  @IsOptional()
  @IsUUID()
  venueMappingId?: string;

  @IsOptional()
  @IsDateString()
  scheduledStart?: string;

  @IsOptional()
  @IsDateString()
  scheduledEnd?: string;

  @IsOptional()
  @IsDateString()
  actualStart?: string;

  @IsOptional()
  @IsDateString()
  actualEnd?: string;

  @IsOptional()
  @IsDateString()
  doorsOpen?: string;

  @IsOptional()
  @IsDateString()
  salesStart?: string;

  @IsOptional()
  @IsDateString()
  salesEnd?: string;

  @IsOptional()
  @IsNumber()
  capacityOverride?: number;

  @IsOptional()
  @IsBoolean()
  isSoldOut?: boolean;

  @IsOptional()
  @IsNumber()
  attendance?: number;

  @IsOptional()
  @IsString()
  cancellationReason?: string;

  @IsOptional()
  @IsDateString()
  cancellationDate?: string;

  @IsOptional()
  @IsUUID()
  rescheduledTo?: string;

  @IsOptional()
  @IsObject()
  broadcastInfo?: any;

  @IsOptional()
  @IsString()
  weatherConditions?: string;

  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsObject()
  results?: any;

  @IsOptional()
  @IsObject()
  statistics?: any;

  @IsOptional()
  @IsObject()
  metadata?: any;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
