import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsString, IsOptional, IsNumber, IsArray, IsBoolean, IsObject } from 'class-validator';

export class UpdateEventRestrictionDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  eventId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  restrictionType?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  minAge?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  maxAge?: number;

  @ApiPropertyOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  requiredGroups?: string[];

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  requiredRoles?: string[];

  @ApiPropertyOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  blockedGroups?: string[];

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedCountries?: string[];

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  blockedCountries?: string[];

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedCities?: string[];

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  dressCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  specialConditions?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isEnforced?: boolean;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  enforcementLevel?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadata?: any;
} 