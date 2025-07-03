import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';

export enum ZoneTypeEnum {
  SEATING_AREA = 'SEATING_AREA',
  STANDING_AREA = 'STANDING_AREA',
  VIP_AREA = 'VIP_AREA',
  SERVICE_AREA = 'SERVICE_AREA',
}

export enum ZoneCategoryEnum {
  STANDARD = 'STANDARD',
  VIP = 'VIP',
  FAMILY = 'FAMILY',
  PRESS = 'PRESS',
  ACCESSIBLE = 'ACCESSIBLE',
}

export enum SeatTypeEnum {
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
  VIP = 'VIP',
  ACCESSIBLE = 'ACCESSIBLE',
  OBSTRUCTED = 'OBSTRUCTED',
}

export enum SeatStatusEnum {
  AVAILABLE = 'AVAILABLE',
  SOLD = 'SOLD',
  BLOCKED = 'BLOCKED',
  MAINTENANCE = 'MAINTENANCE',
}

export class SetSeatMapSeatDto {
  @IsString()
  id: string;

  @IsString()
  reference: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  row?: string;

  @IsOptional()
  @IsString()
  number?: string;

  @IsOptional()
  @IsString()
  section?: string;

  @IsEnum(SeatTypeEnum)
  seatType: SeatTypeEnum;

  @IsEnum(SeatStatusEnum)
  status: SeatStatusEnum;

  @IsOptional()
  @IsObject()
  coordinates?: any;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class SetSeatMapZoneDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  level: number;

  @IsNumber()
  displayOrder: number;

  @IsEnum(ZoneTypeEnum)
  zoneType: ZoneTypeEnum;

  @IsEnum(ZoneCategoryEnum)
  category: ZoneCategoryEnum;

  @IsNumber()
  capacity: number;

  @IsBoolean()
  hasSeats: boolean;

  @IsOptional()
  @IsString()
  seatLayout?: string;

  @IsOptional()
  @IsString()
  details?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsBoolean()
  isActive: boolean;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SetSeatMapSeatDto)
  seats?: SetSeatMapSeatDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SetSeatMapZoneDto)
  children?: SetSeatMapZoneDto[];

  @IsOptional()
  @IsObject()
  mapping?: any;
}

export class SetSeatMapDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SetSeatMapZoneDto)
  zones: SetSeatMapZoneDto[];
} 