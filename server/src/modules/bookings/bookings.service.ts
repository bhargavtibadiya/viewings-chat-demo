import type { Booking, Property, AvailabilitySlot } from '../../generated/client.js';
import prisma from '../../config/prisma.js';
import { createServiceError } from '../../utils/helpers/serviceError.js';
import { notDeleted } from '../../utils/helpers/softDelete.js';
import { formatNzDateTime } from '../../utils/helpers/date.js';
import type { CreateBookingDtoType } from './dto/bookings.dto.js';
import type { CreateBookingResult, SafeBooking } from './types/bookings.types.js';

type BookingWithRelations = Booking & {
  property: Pick<Property, 'id' | 'title' | 'slug' | 'suburb' | 'heroImageUrl'>;
  slot: Pick<AvailabilitySlot, 'id' | 'startsAt' | 'endsAt' | 'timezone'>;
};

export class BookingsService {
  private toSafeBooking(booking: BookingWithRelations): SafeBooking {
    return {
      id: booking.id,
      propertyId: booking.propertyId,
      userId: booking.userId,
      slotId: booking.slotId,
      status: booking.status,
      contactName: booking.contactName,
      contactEmail: booking.contactEmail,
      contactPhone: booking.contactPhone,
      notes: booking.notes,
      createdAt: booking.createdAt.toISOString(),
      property: booking.property,
      slot: {
        id: booking.slot.id,
        startsAt: booking.slot.startsAt.toISOString(),
        endsAt: booking.slot.endsAt.toISOString(),
        timezone: booking.slot.timezone,
      },
    };
  }

  private bookingInclude() {
    return {
      property: {
        select: { id: true, title: true, slug: true, suburb: true, heroImageUrl: true },
      },
      slot: {
        select: { id: true, startsAt: true, endsAt: true, timezone: true },
      },
    };
  }

  async createBooking(userId: string, dto: CreateBookingDtoType): Promise<CreateBookingResult> {
    const slot = await prisma.availabilitySlot.findFirst({
      where: {
        id: dto.slotId,
        propertyId: dto.propertyId,
        ...notDeleted(),
      },
    });

    if (!slot) {
      throw createServiceError(404, 'Slot not found for this property');
    }

    if (slot.isBooked) {
      throw createServiceError(409, 'This slot is no longer available');
    }

    const booking = await prisma.$transaction(async (tx) => {
      const lockedSlot = await tx.availabilitySlot.findFirst({
        where: { id: dto.slotId, isBooked: false, ...notDeleted() },
      });

      if (!lockedSlot) {
        throw createServiceError(409, 'This slot was just booked by someone else');
      }

      const created = await tx.booking.create({
        data: {
          propertyId: dto.propertyId,
          userId,
          slotId: dto.slotId,
          contactName: dto.contactName,
          contactEmail: dto.contactEmail,
          contactPhone: dto.contactPhone,
          notes: dto.notes,
        },
        include: this.bookingInclude(),
      });

      await tx.availabilitySlot.update({
        where: { id: dto.slotId },
        data: { isBooked: true },
      });

      return created;
    });

    const safeBooking = this.toSafeBooking(booking);
    const confirmationMessage = `Your viewing is confirmed for ${formatNzDateTime(booking.slot.startsAt)} at ${booking.property.suburb}. Reference: ${booking.id}`;

    return { booking: safeBooking, confirmationMessage };
  }

  async cancelBooking(userId: string, bookingId: string): Promise<SafeBooking> {
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, userId, ...notDeleted() },
      include: this.bookingInclude(),
    });

    if (!booking) {
      throw createServiceError(404, 'Booking not found');
    }

    if (booking.status === 'CANCELLED') {
      throw createServiceError(400, 'Booking is already cancelled');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const cancelled = await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' },
        include: this.bookingInclude(),
      });

      await tx.availabilitySlot.update({
        where: { id: booking.slotId },
        data: { isBooked: false },
      });

      return cancelled;
    });

    return this.toSafeBooking(updated);
  }

  async listMyBookings(userId: string): Promise<SafeBooking[]> {
    const bookings = await prisma.booking.findMany({
      where: { userId, ...notDeleted() },
      include: this.bookingInclude(),
      orderBy: { createdAt: 'desc' },
    });

    return bookings.map((booking) => this.toSafeBooking(booking));
  }

  async getBookingById(userId: string, bookingId: string): Promise<SafeBooking> {
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, userId, ...notDeleted() },
      include: this.bookingInclude(),
    });

    if (!booking) {
      throw createServiceError(404, 'Booking not found');
    }

    return this.toSafeBooking(booking);
  }

  async createBookingFromTool(
    userId: string,
    input: CreateBookingDtoType,
  ): Promise<CreateBookingResult> {
    return this.createBooking(userId, input);
  }

  async cancelBookingFromTool(userId: string, bookingId: string): Promise<SafeBooking> {
    return this.cancelBooking(userId, bookingId);
  }
}

export const bookingsService = new BookingsService();
