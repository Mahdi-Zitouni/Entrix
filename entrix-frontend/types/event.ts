export interface Event {
  code: string;
  name: string;
  description?: string;
  status: string;
  visibility: string;
  categoryId?: string;
  groupId?: string;
  venueId?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  salesStart?: string;
  salesEnd?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  isActive?: boolean;
} 