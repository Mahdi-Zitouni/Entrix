import { Ticket } from '../types/ticket';

export function TicketCard({ ticket }: { ticket: Ticket }) {
  return (
    <div className="bg-card border border-border rounded-lg shadow-md p-6 flex flex-col gap-2 transition-transform hover:scale-105 hover:shadow-lg">
      <div className="font-bold text-lg text-primary mb-1">Ticket #{ticket.ticketNumber}</div>
      <div className="text-muted-foreground text-sm">User: {ticket.userId}</div>
      <div className="text-muted-foreground text-sm">Event: {ticket.eventId}</div>
      <div className="text-gray-500 text-xs">Price Paid: {ticket.pricePaid} TND</div>
      {ticket.paymentStatus && <div className="text-xs text-blue-600">Payment: {ticket.paymentStatus}</div>}
      {ticket.bookingStatus && <div className="text-xs text-purple-600">Booking: {ticket.bookingStatus}</div>}
      {ticket.isGuestPurchase && ticket.guestEmail && (
        <div className="text-xs text-orange-600">Guest: {ticket.guestEmail}</div>
      )}
    </div>
  );
} 