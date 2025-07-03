import { IsEnum, IsString, IsOptional, IsUUID, IsDate } from 'class-validator';
import {
  AccessAction,
  AccessStatus,
  DenialReason,
} from '../access-control-log.entity';

export class CreateAccessControlLogDto {
  @IsUUID()
  eventId: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsUUID()
  accessRightId: string;

  @IsOptional()
  @IsUUID()
  ticketId?: string;

  @IsOptional()
  @IsString()
  accessPointId?: string;

  @IsEnum(AccessAction)
  action: AccessAction;

  @IsEnum(AccessStatus)
  status: AccessStatus;

  @IsOptional()
  @IsEnum(DenialReason)
  denialReason?: DenialReason;

  @IsOptional()
  @IsDate()
  timestamp?: Date;

  @IsOptional()
  metadata?: Record<string, any>;
}
