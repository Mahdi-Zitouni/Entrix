import { IsUUID, IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateOrderItemDto {
  @IsUUID()
  orderId: string;

  @IsString()
  itemType: string;

  @IsOptional()
  @IsUUID()
  eventId?: string;

  @IsOptional()
  @IsUUID()
  ticketTypeId?: string;

  @IsOptional()
  @IsUUID()
  subscriptionPlanId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  quantity: number;

  @IsString()
  unitPrice: string;

  @IsString()
  totalPrice: string;

  @IsOptional()
  metadata?: any;
} 