import { IsOptional, IsString, IsDateString, IsBoolean, Matches } from 'class-validator';

export class CreateUserProfileDto {
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsBoolean()
  notifications?: boolean;

  @IsOptional()
  @IsBoolean()
  newsletter?: boolean;

  @IsOptional()
  @IsDateString()
  supporterSince?: string;

  @IsOptional()
  @IsString()
  favoritePlayer?: string;

  @IsOptional()
  @Matches(/^\d{8}$/, { message: 'CIN must be exactly 8 digits' })
  cin?: string;
} 