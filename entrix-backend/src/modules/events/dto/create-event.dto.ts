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

export class CreateEventDto {
  @IsString()
  code: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  shortTitle?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  status: string; // Should be enum: DRAFT, SCHEDULED, CONFIRMED, LIVE, FINISHED, CANCELLED, POSTPONED, SUSPENDED

  @IsString()
  visibility: string; // Should be enum: PUBLIC, PRIVATE, MEMBERS_ONLY, VIP_ONLY, STAFF_ONLY

  @IsString()
  categoryId: string;

  @IsOptional()
  @IsString()
  groupId?: string;

  @IsOptional()
  @IsUUID()
  parentEventId?: string;

  @IsString()
  venueId: string;

  @IsOptional()
  @IsUUID()
  venueMappingId?: string;

  @IsDateString()
  scheduledStart: string;

  @IsDateString()
  scheduledEnd: string;

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

  // System-managed fields (not set by client):
  // id, createdAt, updatedAt, createdBy, publishedBy, publishedAt
}
