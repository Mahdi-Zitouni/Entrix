import {
  IsUUID,
  IsString,
  IsBoolean,
  IsOptional,
  IsObject,
} from 'class-validator';

export class UpdateParticipantRelationshipDto {
  @IsOptional()
  @IsUUID()
  participantAId?: string;

  @IsOptional()
  @IsUUID()
  participantBId?: string;

  @IsOptional()
  @IsString()
  relationshipType?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: any;
}
