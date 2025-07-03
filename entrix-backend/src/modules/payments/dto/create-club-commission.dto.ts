import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  IsDate,
} from 'class-validator';

export class CreateClubCommissionDto {
  @IsUUID()
  paymentId: string;

  @IsUUID()
  orderId: string;

  @IsUUID()
  clubId: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsDate()
  paymentDueDate?: Date;

  @IsOptional()
  metadata?: Record<string, any>;
}
