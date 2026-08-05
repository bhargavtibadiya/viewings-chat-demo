import type { BookingStatus } from '../../../generated/client.js';

export interface SafeBooking {
  id: string;
  propertyId: string;
  userId: string;
  slotId: string;
  status: BookingStatus;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  notes: string | null;
  createdAt: string;
  property: {
    id: string;
    title: string;
    slug: string;
    suburb: string;
    heroImageUrl: string;
  };
  slot: {
    id: string;
    startsAt: string;
    endsAt: string;
    timezone: string;
  };
}

export interface BookingsListResponse {
  bookings: SafeBooking[];
}

export interface BookingDetailResponse {
  booking: SafeBooking;
}

export interface CreateBookingResult {
  booking: SafeBooking;
  confirmationMessage: string;
}
