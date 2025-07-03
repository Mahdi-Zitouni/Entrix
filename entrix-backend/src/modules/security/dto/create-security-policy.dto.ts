import { IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class CreateSecurityPolicyDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  rules?: any;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
