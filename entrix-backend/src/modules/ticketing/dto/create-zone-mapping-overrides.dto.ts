import { IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateZoneMappingOverridesDto {
  @IsUUID()
  subscriptionPlanId: string;

  @IsUUID()
  eventId: string;

  @IsString()
  originalZoneId: string;

  @IsString()
  overrideZoneId: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
