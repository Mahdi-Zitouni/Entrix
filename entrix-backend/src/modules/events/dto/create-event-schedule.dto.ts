import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsDateString, IsOptional, IsString, IsNumber, IsBoolean, IsObject } from 'class-validator';

export class CreateEventScheduleDto {
  @ApiProperty()
  @IsUUID()
  eventId: string;

  @ApiProperty()
  @IsString()
  sessionName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sessionCode?: string;

  @ApiProperty()
  @IsString()
  sessionType: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsDateString()
  startTime: string;

  @ApiProperty()
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  venueZoneId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  capacityOverride?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requiresSeparateTicket?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: any;
} 