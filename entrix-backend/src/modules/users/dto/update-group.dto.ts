import { IsString, IsOptional, IsEnum, IsBoolean, IsDateString, IsNumber, IsObject } from 'class-validator';
import { GroupType } from '../group.entity';

export class UpdateGroupDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(GroupType)
  type?: GroupType;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  maxMembers?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
} 