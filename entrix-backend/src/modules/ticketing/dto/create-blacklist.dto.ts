import {
  IsEnum,
  IsString,
  IsOptional,
  IsBoolean,
  IsDate,
  IsUUID,
} from 'class-validator';
import {
  BlacklistType,
  BlacklistScope,
  AppealStatus,
  SeverityLevel,
} from '../blacklist.entity';

export class CreateBlacklistDto {
  @IsEnum(BlacklistType)
  blacklistType: BlacklistType;

  @IsString()
  identifier: string;

  @IsEnum(BlacklistScope)
  scope: BlacklistScope;

  @IsOptional()
  @IsString()
  scopeId?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  eventId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @IsDate()
  endDate?: Date;

  @IsOptional()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsEnum(AppealStatus)
  appealStatus?: AppealStatus;

  @IsOptional()
  @IsEnum(SeverityLevel)
  severity?: SeverityLevel;

  @IsOptional()
  @IsString()
  notes?: string;
}
