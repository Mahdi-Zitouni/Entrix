import { IsEmail, IsOptional, IsString, MinLength, IsBoolean, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateUserProfileDto } from './create-user-profile.dto';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsString()
  @MinLength(8)
  password: string;

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

  @IsOptional()
  @Type(() => CreateUserProfileDto)
  profile?: CreateUserProfileDto;
}
