import { IsString, IsOptional, IsUUID, IsNumber } from 'class-validator';

export class UpdateRateLimitingDto {
  @IsOptional()
  @IsString()
  key?: string;

  @IsOptional()
  @IsNumber()
  points?: number;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;
}
