import {
  IsEnum,
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
} from 'class-validator';
import { AccessTransactionType } from '../access-transactions-log.entity';

export class CreateAccessTransactionsLogDto {
  @IsUUID()
  accessRightId: string;

  @IsOptional()
  @IsUUID()
  eventId?: string;

  @IsOptional()
  @IsUUID()
  fromUserId?: string;

  @IsOptional()
  @IsUUID()
  toUserId?: string;

  @IsEnum(AccessTransactionType)
  transactionType: AccessTransactionType;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  metadata?: Record<string, any>;
}
