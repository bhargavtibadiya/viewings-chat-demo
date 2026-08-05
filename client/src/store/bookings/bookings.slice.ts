import { createSlice } from '@reduxjs/toolkit';
import {
  cancelBookingThunk,
  createBookingThunk,
  getBookingByIdThunk,
  getBookingsThunk,
} from '@/store/bookings/bookings.thunk';
import type { BookingsSliceInterface } from '@/store/bookings/bookings.types';

const initialState: BookingsSliceInterface = {
  getBookingsLoading: false,
  hasRequestedBookings: false,
  bookings: [],
  getBookingByIdLoading: false,
  booking: null,
  createBookingLoading: false,
  cancelBookingLoading: false,
};

const bookingsSlice = createSlice({
  name: 'bookings',
  initialState,
  reducers: {
    clearBookingDetail: (state) => ({
      ...state,
      booking: null,
    }),
  },
  extraReducers: (builder) => {
    builder
      .addCase(getBookingsThunk.pending, (state) => ({
        ...state,
        getBookingsLoading: true,
        hasRequestedBookings: true,
      }))
      .addCase(getBookingsThunk.fulfilled, (state, action) => ({
        ...state,
        getBookingsLoading: false,
        bookings: action.payload.data.bookings,
      }))
      .addCase(getBookingsThunk.rejected, (state) => ({
        ...state,
        getBookingsLoading: false,
      }))
      .addCase(getBookingByIdThunk.pending, (state) => ({
        ...state,
        getBookingByIdLoading: true,
      }))
      .addCase(getBookingByIdThunk.fulfilled, (state, action) => ({
        ...state,
        getBookingByIdLoading: false,
        booking: action.payload.data.booking,
      }))
      .addCase(getBookingByIdThunk.rejected, (state) => ({
        ...state,
        getBookingByIdLoading: false,
        booking: null,
      }))
      .addCase(createBookingThunk.pending, (state) => ({
        ...state,
        createBookingLoading: true,
      }))
      .addCase(createBookingThunk.fulfilled, (state, action) => ({
        ...state,
        createBookingLoading: false,
        bookings: [action.payload.data.booking, ...state.bookings],
      }))
      .addCase(createBookingThunk.rejected, (state) => ({
        ...state,
        createBookingLoading: false,
      }))
      .addCase(cancelBookingThunk.pending, (state) => ({
        ...state,
        cancelBookingLoading: true,
      }))
      .addCase(cancelBookingThunk.fulfilled, (state, action) => ({
        ...state,
        cancelBookingLoading: false,
        booking: action.payload.data.booking,
        bookings: state.bookings.map((item) =>
          item.id === action.payload.data.booking.id ? action.payload.data.booking : item,
        ),
      }))
      .addCase(cancelBookingThunk.rejected, (state) => ({
        ...state,
        cancelBookingLoading: false,
      }));
  },
});

export const { clearBookingDetail } = bookingsSlice.actions;
export default bookingsSlice.reducer;
