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

// ============================================================================
// BOOKING THUNKS
// Loads and mutates viewing bookings for the authenticated user
// ============================================================================

/**
 * Retrieves bookings for the authenticated user.
 *
 * @returns A dispatchable action resolving with bookings or an API error
 */
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
    // [PERF] Suppress duplicate list requests while bookings are already loading.
    condition: (_, { getState }) => !getState().bookings.getBookingsLoading,
  },
);

/**
 * Retrieves a booking by identifier.
 *
 * @param data - Booking identifier
 * @returns A dispatchable action resolving with the booking or an API error
 */
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

/**
 * Creates a viewing booking for an available slot.
 *
 * @param data - Booking details and selected availability slot
 * @returns A dispatchable action resolving with the created booking or an API error
 */
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

/**
 * Cancels an existing viewing booking.
 *
 * @param data - Booking identifier to cancel
 * @returns A dispatchable action resolving with the cancelled booking or an API error
 */
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
