import { IsEnum, IsString, IsOptional, IsUUID, IsDate } from 'class-validator';
import { AccessRightStatus, AccessSourceType } from '../access-rights.entity';

export class CreateAccessRightsDto {
  @IsString()
  qrCode: string;

  @IsUUID()
  userId: string;

  @IsUUID()
  eventId: string;

  @IsOptional()
  @IsUUID()
  subscriptionId?: string;

  @IsOptional()
  @IsUUID()
  ticketId?: string;

  @IsEnum(AccessRightStatus)
  status: AccessRightStatus;

  @IsEnum(AccessSourceType)
  sourceType: AccessSourceType;

  @IsOptional()
  @IsString()
  sourceId?: string;

  @IsOptional()
  @IsDate()
  validFrom?: Date;

  @IsOptional()
  @IsDate()
  validUntil?: Date;

  @IsOptional()
  metadata?: Record<string, any>;
}
