import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  IsBoolean,
  IsDateString,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  emailVerified?: string;

  @IsOptional()
  @IsDateString()
  phoneVerified?: string;

  // System-managed fields (not set by client):
  // createdAt, updatedAt, lastLogin

  // Optionally, for profile fields:
  // @IsOptional()
  // @ValidateNested()
  // @Type(() => UpdateUserProfileDto)
  // profile?: UpdateUserProfileDto;
}
