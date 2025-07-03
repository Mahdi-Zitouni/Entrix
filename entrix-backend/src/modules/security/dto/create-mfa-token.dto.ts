import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsBoolean,
} from 'class-validator';

export class CreateMfaTokenDto {
  @IsUUID()
  userId: string;

  @IsString()
  token: string;

  @IsString()
  type: string;

  @IsOptional()
  @IsBoolean()
  isUsed?: boolean;

  @IsOptional()
  @IsDateString()
  expiresAt?: Date;
}
