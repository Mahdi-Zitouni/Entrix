import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsString, IsOptional, IsNumber, IsArray, IsBoolean, IsObject } from 'class-validator';

export class CreateEventRestrictionDto {
  @ApiProperty()
  @IsUUID()
  eventId: string;

  @ApiProperty()
  @IsString()
  restrictionType: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  minAge?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxAge?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  requiredGroups?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredRoles?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  blockedGroups?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedCountries?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  blockedCountries?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedCities?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dressCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialConditions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isEnforced?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  enforcementLevel?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: any;
} 