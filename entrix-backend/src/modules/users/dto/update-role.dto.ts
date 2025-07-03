import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  level?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
} 