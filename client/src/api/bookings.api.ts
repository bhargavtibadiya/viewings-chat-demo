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
  getBookings: () => axiosInstance.get<IGetBookingsThunkResponse>(ROUTES.BOOKINGS.LIST),

  getBookingById: (data: IGetBookingByIdThunkPayload) => {
    const url = replaceRouteParam(ROUTES.BOOKINGS.BY_ID, ':id', data.bookingId);
    return axiosInstance.get<IGetBookingByIdThunkResponse>(url);
  },

  createBooking: (data: ICreateBookingThunkPayload) =>
    axiosInstance.post<ICreateBookingThunkResponse>(ROUTES.BOOKINGS.CREATE, data),

  cancelBooking: (data: ICancelBookingThunkPayload) => {
    const url = replaceRouteParam(ROUTES.BOOKINGS.CANCEL, ':id', data.bookingId);
    return axiosInstance.post<ICancelBookingThunkResponse>(url);
  },
};
