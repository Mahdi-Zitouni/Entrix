import { VenueCard } from '../../components/VenueCard';
import { Venue } from '../../types/venue';

const venues: Venue[] = [
  {
    id: 'venue1',
    name: 'Stade Taïeb Mhiri',
    slug: 'taieb-mhiri',
    address: 'Rue Taieb Mhiri, Sfax',
    city: 'Sfax',
    maxCapacity: 22000,
    country: 'TN',
    images: ['https://upload.wikimedia.org/wikipedia/commons/7/7e/Stade_Taieb_Mhiri.jpg'],
    isActive: true,
  },
  {
    id: 'venue2',
    name: 'Stade Chedly Zouiten',
    slug: 'chedly-zouiten',
    address: 'Rue Chedly Zouiten, Tunis',
    city: 'Tunis',
    maxCapacity: 18000,
    country: 'TN',
    images: ['https://upload.wikimedia.org/wikipedia/commons/3/3e/Stade_Chedly_Zouiten.jpg'],
    isActive: false,
  },
];

export default function VenuesPage() {
  return (
    <main className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Venues</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {venues.map((venue) => (
          <VenueCard key={venue.id} venue={venue} />
        ))}
      </div>
    </main>
  );
} 