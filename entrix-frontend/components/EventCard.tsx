import { Event } from '../types/event';

export function EventCard({ event }: { event: Event }) {
  return (
    <div className="bg-card border border-border rounded-lg shadow-md p-6 flex flex-col gap-2 transition-transform hover:scale-105 hover:shadow-lg">
      <div className="font-bold text-lg text-primary mb-1">{event.name}</div>
      <div className="text-muted-foreground text-xs mb-2">{event.code}</div>
      {event.description && <div className="text-gray-500 text-sm mb-2">{event.description}</div>}
      <div className="flex gap-2 text-xs mb-2">
        <span className="bg-accent text-accent-foreground px-2 py-1 rounded">{event.status}</span>
        <span className="bg-muted text-muted-foreground px-2 py-1 rounded">{event.visibility}</span>
        {event.isActive && <span className="bg-green-100 text-green-700 px-2 py-1 rounded">Active</span>}
      </div>
      {event.scheduledStart && (
        <div className="text-xs text-gray-500">Start: {new Date(event.scheduledStart).toLocaleString()}</div>
      )}
    </div>
  );
} 