import { axiosInstance } from '@/utils/api/axiosInstance';
import { replaceRouteParam, ROUTES } from '@/utils/helpers/routes';
import type {
  IGetBookingsThunkResponse,
  IGetBookingByIdThunkPayload,
  IGetBookingByIdThunkResponse,
  ICreateBookingThunkPayload,
  ICreateBookingThunkResponse,
  ICancelBookingThunkPayload,
  ICancelBookingThunkResponse,
} from '@/store/bookings/bookings.types';

export const bookingsService = {
  /**
   * Retrieves bookings belonging to the authenticated user.
   *
   * @returns The API response containing the user's bookings
   */
  getBookings: () => axiosInstance.get<IGetBookingsThunkResponse>(ROUTES.BOOKINGS.LIST),

  /**
   * Retrieves one booking by identifier.
   *
   * @param data - Booking identifier
   * @returns The API response containing the booking
   */
  getBookingById: (data: IGetBookingByIdThunkPayload) => {
    const url = replaceRouteParam(ROUTES.BOOKINGS.BY_ID, ':id', data.bookingId);
    return axiosInstance.get<IGetBookingByIdThunkResponse>(url);
  },

  /**
   * Creates a viewing booking.
   *
   * @param data - Booking details and selected availability slot
   * @returns The API response containing the created booking
   */
  createBooking: (data: ICreateBookingThunkPayload) =>
    axiosInstance.post<ICreateBookingThunkResponse>(ROUTES.BOOKINGS.CREATE, data),

  /**
   * Cancels an existing booking.
   *
   * @param data - Booking identifier to cancel
   * @returns The API response containing the cancelled booking
   */
  cancelBooking: (data: ICancelBookingThunkPayload) => {
    const url = replaceRouteParam(ROUTES.BOOKINGS.CANCEL, ':id', data.bookingId);
    return axiosInstance.post<ICancelBookingThunkResponse>(url);
  },
};
