import { IsString, IsOptional, IsUUID, IsNumber } from 'class-validator';

export class CreateRateLimitingDto {
  @IsString()
  key: string;

  @IsNumber()
  points: number;

  @IsNumber()
  duration: number;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;
}
