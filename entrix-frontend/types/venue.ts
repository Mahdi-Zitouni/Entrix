export interface Venue {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  maxCapacity: number;
  description?: string;
  images?: string[];
  globalAmenities?: string[];
  defaultMappingId?: string;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
} 