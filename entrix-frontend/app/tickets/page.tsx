import { TicketCard } from '../../components/TicketCard';
import { Ticket } from '../../types/ticket';

const tickets: Ticket[] = [
  {
    ticketNumber: 'A12345',
    userId: 'john.doe@example.com',
    eventId: 'EVT001',
    pricePaid: 30,
    paymentStatus: 'Paid',
    bookingStatus: 'Confirmed',
  },
  {
    ticketNumber: 'B67890',
    userId: 'jane.smith@example.com',
    eventId: 'EVT002',
    pricePaid: 25,
    paymentStatus: 'Pending',
    bookingStatus: 'Reserved',
    isGuestPurchase: true,
    guestEmail: 'guest@example.com',
  },
];

export default function TicketsPage() {
  return (
    <main className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Tickets</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tickets.map((ticket) => (
          <TicketCard key={ticket.ticketNumber} ticket={ticket} />
        ))}
      </div>
    </main>
  );
} 