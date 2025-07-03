import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsDateString, IsOptional, IsString, IsNumber, IsBoolean, IsObject } from 'class-validator';

export class UpdateEventScheduleDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  eventId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sessionName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sessionCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  sessionType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  venueZoneId?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  capacityOverride?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  requiresSeparateTicket?: boolean;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  displayOrder?: number;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadata?: any;
} 