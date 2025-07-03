import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsBoolean,
} from 'class-validator';

export class UpdateUserSessionDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: Date;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  refreshToken?: string;
}
