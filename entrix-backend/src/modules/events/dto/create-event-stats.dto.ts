import {
  IsUUID,
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  IsObject,
  IsBoolean,
} from 'class-validator';

export class CreateEventStatsDto {
  @IsUUID()
  eventId: string;

  @IsOptional()
  @IsUUID()
  participantId?: string;

  @IsString()
  statType: string;

  @IsOptional()
  @IsString()
  statCategory?: string;

  @IsString()
  statKey: string;

  @IsString()
  statValue: string;

  @IsDateString()
  recordedAt: string;

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
