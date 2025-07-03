import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsString, IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class UpdateParticipantStaffDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  participantId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  role?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  assignedAt?: Date;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
} 