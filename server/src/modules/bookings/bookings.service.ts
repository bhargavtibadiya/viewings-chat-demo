import type { Booking, Property, AvailabilitySlot } from '../../generated/client.js';
import prisma from '../../config/prisma.js';
import { createServiceError } from '../../utils/helpers/serviceError.js';
import { notDeleted } from '../../utils/helpers/softDelete.js';
import { formatNzDateTime } from '../../utils/helpers/date.js';
import type { CreateBookingDtoType, ResolvedCreateBookingDto } from './dto/bookings.dto.js';
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

  /**
   * Fills missing booking contact details from the authenticated user.
   *
   * @param userId - ID of the booking user
   * @param dto - Validated booking request
   * @returns A booking request with required contact details
   * @throws {ServiceError} if the user does not exist
   */
  async resolveContactFromUser(
    userId: string,
    dto: CreateBookingDtoType,
  ): Promise<ResolvedCreateBookingDto> {
    if (dto.contactName && dto.contactEmail) {
      return {
        ...dto,
        contactName: dto.contactName,
        contactEmail: dto.contactEmail,
      };
    }

    const user = await prisma.user.findFirst({
      where: { id: userId, ...notDeleted() },
      select: { name: true, email: true },
    });

    if (!user) {
      throw createServiceError(404, 'User not found');
    }

    return {
      ...dto,
      contactName: dto.contactName ?? user.name,
      contactEmail: dto.contactEmail ?? user.email,
    };
  }

  /**
   * Confirms a viewing booking, replacing another confirmed booking for the same property.
   *
   * @param userId - ID of the booking user
   * @param dto - Validated booking request
   * @returns The confirmed booking and any bookings it replaced
   * @throws {ServiceError} if the slot is unavailable or the request is invalid
   */
  async createBooking(userId: string, dto: CreateBookingDtoType): Promise<CreateBookingResult> {
    const resolved = await this.resolveContactFromUser(userId, dto);

    const slot = await prisma.availabilitySlot.findFirst({
      where: {
        id: resolved.slotId,
        propertyId: resolved.propertyId,
        ...notDeleted(),
      },
    });

    if (!slot) {
      throw createServiceError(404, 'Slot not found for this property');
    }

    // [WHY] Retrying the same booking must return the original confirmation without duplicating it.
    const existingOnSlot = await prisma.booking.findFirst({
      where: {
        userId,
        propertyId: resolved.propertyId,
        slotId: resolved.slotId,
        status: 'CONFIRMED',
        ...notDeleted(),
      },
      include: this.bookingInclude(),
    });

    if (existingOnSlot) {
      const safeExisting = this.toSafeBooking(existingOnSlot);
      return {
        booking: safeExisting,
        confirmationMessage: `Your viewing is already confirmed for ${formatNzDateTime(existingOnSlot.slot.startsAt)} at ${existingOnSlot.property.suburb}. Reference: ${existingOnSlot.id}`,
        replacedBookingIds: [],
      };
    }

    if (slot.isBooked) {
      throw createServiceError(409, 'This slot is no longer available');
    }

    // [WHY] A visitor can hold only one active viewing for a property at a time.
    const previousConfirmed = await prisma.booking.findMany({
      where: {
        userId,
        propertyId: resolved.propertyId,
        status: 'CONFIRMED',
        ...notDeleted(),
      },
      include: this.bookingInclude(),
    });

    const booking = await prisma.$transaction(async (tx) => {
      const replacedIds: string[] = [];

      for (const previous of previousConfirmed) {
        await tx.booking.update({
          where: { id: previous.id },
          data: { status: 'CANCELLED' },
        });
        await tx.availabilitySlot.update({
          where: { id: previous.slotId },
          data: { isBooked: false },
        });
        replacedIds.push(previous.id);
      }

      const lockedSlot = await tx.availabilitySlot.findFirst({
        where: { id: resolved.slotId, isBooked: false, ...notDeleted() },
      });

      if (!lockedSlot) {
        throw createServiceError(409, 'This slot was just booked by someone else');
      }

      const created = await tx.booking.create({
        data: {
          propertyId: resolved.propertyId,
          userId,
          slotId: resolved.slotId,
          contactName: resolved.contactName,
          contactEmail: resolved.contactEmail,
          contactPhone: resolved.contactPhone,
          notes: resolved.notes,
        },
        include: this.bookingInclude(),
      });

      await tx.availabilitySlot.update({
        where: { id: resolved.slotId },
        data: { isBooked: true },
      });

      return { created, replacedIds };
    });

    const safeBooking = this.toSafeBooking(booking.created);
    const when = formatNzDateTime(booking.created.slot.startsAt);
    const suburb = booking.created.property.suburb;

    const confirmationMessage =
      booking.replacedIds.length > 0
        ? `Your viewing was moved to ${when} at ${suburb}. Your previous booking for this property was cancelled. Reference: ${booking.created.id}`
        : `Your viewing is confirmed for ${when} at ${suburb}. Reference: ${booking.created.id}`;

    return {
      booking: safeBooking,
      confirmationMessage,
      replacedBookingIds: booking.replacedIds,
    };
  }

  /**
   * Cancels an owned booking and reopens its slot.
   *
   * @param userId - ID of the booking owner
   * @param bookingId - ID of the booking to cancel
   * @returns The cancelled booking
   * @throws {ServiceError} if the booking is missing or already cancelled
   */
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

  /**
   * Lists all non-deleted bookings belonging to a user.
   *
   * @param userId - ID of the booking owner
   * @returns The user's bookings in reverse creation order
   */
  async listMyBookings(userId: string): Promise<SafeBooking[]> {
    const bookings = await prisma.booking.findMany({
      where: { userId, ...notDeleted() },
      include: this.bookingInclude(),
      orderBy: { createdAt: 'desc' },
    });

    return bookings.map((booking) => this.toSafeBooking(booking));
  }

  /**
   * Retrieves a booking owned by the requesting user.
   *
   * @param userId - ID of the booking owner
   * @param bookingId - ID of the booking to retrieve
   * @returns The requested booking
   * @throws {ServiceError} if the booking is unavailable
   */
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

  /**
   * Creates a booking on behalf of an agent tool call.
   *
   * @param userId - ID of the booking user
   * @param input - Validated booking input
   * @returns The confirmed booking result
   */
  async createBookingFromTool(
    userId: string,
    input: CreateBookingDtoType,
  ): Promise<CreateBookingResult> {
    return this.createBooking(userId, input);
  }

  /**
   * Cancels a booking on behalf of an agent tool call.
   *
   * @param userId - ID of the booking owner
   * @param bookingId - ID of the booking to cancel
   * @returns The cancelled booking
   */
  async cancelBookingFromTool(userId: string, bookingId: string): Promise<SafeBooking> {
    return this.cancelBooking(userId, bookingId);
  }
}

export const bookingsService = new BookingsService();
