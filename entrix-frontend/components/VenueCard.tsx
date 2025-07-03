import { Venue } from '../types/venue';

export function VenueCard({ venue }: { venue: Venue }) {
  return (
    <div className="bg-card border border-border rounded-lg shadow-md p-6 flex flex-col gap-2 transition-transform hover:scale-105 hover:shadow-lg">
      <div className="font-bold text-lg text-primary mb-1">{venue.name}</div>
      <div className="text-muted-foreground text-sm mb-1">{venue.city}, {venue.country || 'TN'}</div>
      <div className="text-gray-500 text-xs mb-1">Capacity: {venue.maxCapacity}</div>
      {venue.address && <div className="text-xs text-gray-400 mb-1">{venue.address}</div>}
      {venue.images && venue.images.length > 0 && (
        <img src={venue.images[0]} alt={venue.name} className="w-full h-32 object-cover rounded mb-2 border" />
      )}
      {venue.isActive && <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">Active</span>}
    </div>
  );
} 