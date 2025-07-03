import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  IsBoolean,
  IsObject,
} from 'class-validator';

export class UpdateTicketDto {
  @IsOptional()
  @IsString()
  ticketNumber?: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsUUID()
  eventId?: string;

  @IsOptional()
  @IsUUID()
  seatId?: string;

  @IsOptional()
  @IsUUID()
  ticketTypeId?: string;

  @IsOptional()
  @IsUUID()
  subscriptionId?: string;

  @IsOptional()
  @IsNumber()
  pricePaid?: number;

  @IsOptional()
  @IsUUID()
  paymentId?: string;

  @IsOptional()
  @IsString()
  paymentStatus?: string;

  @IsOptional()
  @IsString()
  bookingStatus?: string;

  @IsOptional()
  @IsBoolean()
  isGuestPurchase?: boolean;

  @IsOptional()
  @IsString()
  guestEmail?: string;

  @IsOptional()
  @IsObject()
  guestInfo?: any;

  @IsOptional()
  @IsObject()
  metadata?: any;

  @IsOptional()
  @IsUUID()
  createdBy?: string;
}
