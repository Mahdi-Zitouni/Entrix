import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { MembershipStatus } from '../user-role.entity';

export class CreateUserRoleDto {
  @IsString()
  user: string; // userId (UUID)

  @IsString()
  role: string; // roleId (UUID)

  @IsOptional()
  @IsDateString()
  assignedAt?: string;

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsEnum(MembershipStatus)
  status?: MembershipStatus;

  @IsOptional()
  @IsString()
  assignedBy?: string; // userId (UUID)

  @IsOptional()
  @IsString()
  notes?: string;
} 