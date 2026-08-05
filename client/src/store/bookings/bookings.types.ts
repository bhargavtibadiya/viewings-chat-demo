import type { ApiSuccessResponse, IBooking } from '@/store/types';

export interface IGetBookingsThunkResponseData {
  bookings: IBooking[];
}

export type IGetBookingsThunkResponse = ApiSuccessResponse<IGetBookingsThunkResponseData>;

export interface IGetBookingByIdThunkPayload {
  bookingId: string;
}

export interface IGetBookingByIdThunkResponseData {
  booking: IBooking;
}

export type IGetBookingByIdThunkResponse = ApiSuccessResponse<IGetBookingByIdThunkResponseData>;

export interface ICreateBookingThunkPayload {
  propertyId: string;
  slotId: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  notes?: string;
}

export interface ICreateBookingThunkResponseData {
  booking: IBooking;
}

export type ICreateBookingThunkResponse = ApiSuccessResponse<ICreateBookingThunkResponseData>;

export interface ICancelBookingThunkPayload {
  bookingId: string;
}

export interface ICancelBookingThunkResponseData {
  booking: IBooking;
}

export type ICancelBookingThunkResponse = ApiSuccessResponse<ICancelBookingThunkResponseData>;

export interface BookingsSliceInterface {
  getBookingsLoading: boolean;
  hasRequestedBookings: boolean;
  bookings: IBooking[];
  getBookingByIdLoading: boolean;
  booking: IBooking | null;
  createBookingLoading: boolean;
  cancelBookingLoading: boolean;
}
