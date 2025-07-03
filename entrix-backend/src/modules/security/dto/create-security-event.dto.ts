import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsObject,
} from 'class-validator';

export class CreateSecurityEventDto {
  @IsString()
  eventType: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsObject()
  details?: any;

  @IsOptional()
  @IsDateString()
  occurredAt?: Date;
}
