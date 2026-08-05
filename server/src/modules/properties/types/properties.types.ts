import type { ListingType } from '../../../generated/client.js';

export interface SafeListingAttribute {
  key: string;
  value: string | number | boolean | string[] | null;
  source: string;
}

export interface SafePropertySummary {
  id: string;
  title: string;
  slug: string;
  listingType: ListingType;
  suburb: string;
  city: string;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  rentWeekly: number | null;
  bond: number | null;
  price: number | null;
  availableFrom: string | null;
  heroImageUrl: string;
  fixtureKey: string | null;
}

export interface SafePropertyDetail extends SafePropertySummary {
  addressLine: string;
  description: string;
  imageUrls: string[];
  attributes: SafeListingAttribute[];
  lister: {
    id: string;
    name: string;
  };
}

export interface SafeAvailabilitySlot {
  id: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  isBooked: boolean;
  /** Human-readable NZ label for the agent and UI, e.g. "Fri 7 Aug 2026, 9:00 am" */
  label: string;
}

export interface PaginatedPropertiesResponse {
  properties: SafePropertySummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface PropertyAvailabilityResponse {
  slots: SafeAvailabilitySlot[];
}
