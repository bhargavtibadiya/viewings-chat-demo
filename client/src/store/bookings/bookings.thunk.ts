import { createAsyncThunk } from '@reduxjs/toolkit';
import { bookingsService } from '@/api/bookings.api';
import { extractApiError } from '@/utils/helpers/extractApiError';
import { getErrorMessage } from '@/utils/helpers/getErrorMessage';
import type { ApiErrorData } from '@/store/types';
import type { RootState } from '@/store/rootReducer';
import type {
  IGetBookingsThunkResponse,
  IGetBookingByIdThunkPayload,
  IGetBookingByIdThunkResponse,
  ICreateBookingThunkPayload,
  ICreateBookingThunkResponse,
  ICancelBookingThunkPayload,
  ICancelBookingThunkResponse,
} from '@/store/bookings/bookings.types';

export const getBookingsThunk = createAsyncThunk<
  IGetBookingsThunkResponse,
  void,
  { rejectValue: ApiErrorData; state: RootState }
>(
  'bookings/getBookings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await bookingsService.getBookings();
      return response.data;
    } catch (error: unknown) {
      const fallback = getErrorMessage(error, 'Failed to load bookings');
      return rejectWithValue({ data: extractApiError(error, fallback) });
    }
  },
  {
    condition: (_, { getState }) => !getState().bookings.getBookingsLoading,
  },
);

export const getBookingByIdThunk = createAsyncThunk<
  IGetBookingByIdThunkResponse,
  IGetBookingByIdThunkPayload,
  { rejectValue: ApiErrorData }
>('bookings/getBookingById', async (data, { rejectWithValue }) => {
  try {
    const response = await bookingsService.getBookingById(data);
    return response.data;
  } catch (error: unknown) {
    const fallback = getErrorMessage(error, 'Failed to load booking');
    return rejectWithValue({ data: extractApiError(error, fallback) });
  }
});

export const createBookingThunk = createAsyncThunk<
  ICreateBookingThunkResponse,
  ICreateBookingThunkPayload,
  { rejectValue: ApiErrorData }
>('bookings/createBooking', async (data, { rejectWithValue }) => {
  try {
    const response = await bookingsService.createBooking(data);
    return response.data;
  } catch (error: unknown) {
    const fallback = getErrorMessage(error, 'Failed to create booking');
    return rejectWithValue({ data: extractApiError(error, fallback) });
  }
});

export const cancelBookingThunk = createAsyncThunk<
  ICancelBookingThunkResponse,
  ICancelBookingThunkPayload,
  { rejectValue: ApiErrorData }
>('bookings/cancelBooking', async (data, { rejectWithValue }) => {
  try {
    const response = await bookingsService.cancelBooking(data);
    return response.data;
  } catch (error: unknown) {
    const fallback = getErrorMessage(error, 'Failed to cancel booking');
    return rejectWithValue({ data: extractApiError(error, fallback) });
  }
});
