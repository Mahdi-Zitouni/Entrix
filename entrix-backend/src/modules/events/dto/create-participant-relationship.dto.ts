import {
  IsUUID,
  IsString,
  IsBoolean,
  IsOptional,
  IsObject,
} from 'class-validator';

export class CreateParticipantRelationshipDto {
  @IsUUID()
  participantAId: string;

  @IsUUID()
  participantBId: string;

  @IsString()
  relationshipType: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: any;
}
