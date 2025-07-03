import {
  IsString,
  IsOptional,
  IsUUID,
  IsBoolean,
  IsDateString,
} from 'class-validator';

export class CreateLoginAttemptDto {
  @IsUUID()
  userId: string;

  @IsString()
  ipAddress: string;

  @IsString()
  userAgent: string;

  @IsBoolean()
  success: boolean;

  @IsOptional()
  @IsString()
  failureReason?: string;

  @IsOptional()
  @IsDateString()
  attemptedAt?: Date;
}
