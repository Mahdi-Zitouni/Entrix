import {
  IsUUID,
  IsOptional,
  IsString,
  IsDateString,
  IsObject,
  IsBoolean,
} from 'class-validator';

export class UpdateEventStatsDto {
  @IsOptional()
  @IsUUID()
  eventId?: string;

  @IsOptional()
  @IsUUID()
  participantId?: string;

  @IsOptional()
  @IsString()
  statType?: string;

  @IsOptional()
  @IsString()
  statCategory?: string;

  @IsOptional()
  @IsString()
  statKey?: string;

  @IsOptional()
  @IsString()
  statValue?: string;

  @IsOptional()
  @IsDateString()
  recordedAt?: string;

  @IsOptional()
  @IsUUID()
  recordedBy?: string;

  @IsOptional()
  @IsBoolean()
  isOfficial?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: any;
}
