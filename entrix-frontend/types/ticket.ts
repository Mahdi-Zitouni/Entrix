export interface Ticket {
  ticketNumber: string;
  userId: string;
  eventId: string;
  seatId?: string;
  ticketTypeId?: string;
  subscriptionId?: string;
  pricePaid: number;
  paymentId?: string;
  paymentStatus?: string;
  bookingStatus?: string;
  isGuestPurchase?: boolean;
  guestEmail?: string;
  guestInfo?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdBy?: string;
} 