import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsString, IsOptional, IsInt, IsNumberString, IsObject } from 'class-validator';

export class UpdateOrderItemDto {
  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  orderId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  itemType?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  eventId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  ticketTypeId?: string;

  @ApiPropertyOptional()
  @IsUUID()
  @IsOptional()
  subscriptionPlanId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsInt()
  @IsOptional()
  quantity?: number;

  @ApiPropertyOptional()
  @IsNumberString()
  @IsOptional()
  unitPrice?: string;

  @ApiPropertyOptional()
  @IsNumberString()
  @IsOptional()
  totalPrice?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  metadata?: any;
} 