import { EventCard } from '../../components/EventCard';
import { Event } from '../../types/event';

const events: Event[] = [
  {
    code: 'EVT001',
    name: 'CSS vs EST',
    status: 'Scheduled',
    visibility: 'Public',
    scheduledStart: '2025-07-10T18:00:00Z',
    isActive: true,
  },
  {
    code: 'EVT002',
    name: 'CSS vs CA',
    status: 'Scheduled',
    visibility: 'Public',
    scheduledStart: '2025-07-17T18:00:00Z',
    isActive: true,
  },
];

export default function EventsPage() {
  return (
    <main className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Events</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {events.map((event) => (
          <EventCard key={event.code} event={event} />
        ))}
      </div>
    </main>
  );
} 