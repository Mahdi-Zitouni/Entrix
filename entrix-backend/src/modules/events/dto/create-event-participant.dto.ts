import {
  IsUUID,
  IsString,
  IsBoolean,
  IsOptional,
  IsObject,
} from 'class-validator';

export class CreateEventParticipantDto {
  @IsUUID()
  eventId: string;

  @IsUUID()
  participantId: string;

  @IsString()
  role: string;

  @IsOptional()
  @IsBoolean()
  isConfirmed?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: any;
}
