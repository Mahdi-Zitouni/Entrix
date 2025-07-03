import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsBoolean,
} from 'class-validator';

export class CreateUserSessionDto {
  @IsUUID()
  userId: string;

  @IsString()
  ipAddress: string;

  @IsString()
  userAgent: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: Date;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  refreshToken?: string;

  @IsString()
  sessionToken: string;

  @IsOptional()
  @IsString()
  deviceFingerprint?: string;

  @IsOptional()
  @IsString()
  location?: any;

  @IsOptional()
  @IsBoolean()
  isMobile?: boolean;

  @IsOptional()
  @IsDateString()
  lastActivity?: Date;

  @IsOptional()
  @IsString()
  logoutReason?: string;

  @IsOptional()
  @IsString()
  metadata?: any;

  @IsOptional()
  @IsDateString()
  endedAt?: Date;
}
