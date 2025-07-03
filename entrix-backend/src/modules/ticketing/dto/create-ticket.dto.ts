import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  IsBoolean,
  IsObject,
} from 'class-validator';

export class CreateTicketDto {
  @IsString()
  ticketNumber: string;

  @IsUUID()
  userId: string;

  @IsUUID()
  eventId: string;

  @IsOptional()
  @IsUUID()
  seatId?: string;

  @IsOptional()
  @IsUUID()
  ticketTypeId?: string;

  @IsOptional()
  @IsUUID()
  subscriptionId?: string;

  @IsNumber()
  pricePaid: number;

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
  guestInfo?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @IsOptional()
  @IsUUID()
  createdBy?: string;
}
