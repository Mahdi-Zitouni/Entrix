import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsUUID,
  IsObject,
} from 'class-validator';

export class CreateEventCategoryDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  parentCategoryId?: string;

  @IsOptional()
  @IsNumber()
  defaultDuration?: number;

  @IsOptional()
  @IsNumber()
  defaultCapacity?: number;

  @IsOptional()
  @IsBoolean()
  requiresReferee?: boolean;

  @IsOptional()
  @IsBoolean()
  allowsDraw?: boolean;

  @IsOptional()
  @IsBoolean()
  hasOvertime?: boolean;

  @IsOptional()
  @IsBoolean()
  hasPenalties?: boolean;

  @IsOptional()
  @IsString()
  iconUrl?: string;

  @IsOptional()
  @IsString()
  colorPrimary?: string;

  @IsOptional()
  @IsString()
  colorSecondary?: string;

  @IsOptional()
  @IsNumber()
  defaultTicketPrice?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsObject()
  rules?: any;

  @IsOptional()
  @IsObject()
  metadata?: any;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}
