import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  getAvailabilityThunk,
  getPropertiesThunk,
  getPropertyByIdThunk,
} from '@/store/properties/properties.thunk';
import type {
  IGetPropertiesThunkPayload,
  PropertiesSliceInterface,
} from '@/store/properties/properties.types';

const initialFilters: IGetPropertiesThunkPayload = {};

const initialState: PropertiesSliceInterface = {
  getPropertiesLoading: false,
  hasRequestedProperties: false,
  properties: [],
  getPropertyByIdLoading: false,
  property: null,
  getAvailabilityLoading: false,
  availabilitySlots: [],
  searchFilters: initialFilters,
};

const propertiesSlice = createSlice({
  name: 'properties',
  initialState,
  reducers: {
    setSearchFilters: (state, action: PayloadAction<Partial<IGetPropertiesThunkPayload>>) => ({
      ...state,
      searchFilters: { ...state.searchFilters, ...action.payload },
    }),
    resetSearchFilters: (state) => ({
      ...state,
      searchFilters: initialFilters,
    }),
    clearPropertyDetail: (state) => ({
      ...state,
      property: null,
    }),
  },
  extraReducers: (builder) => {
    builder
      .addCase(getPropertiesThunk.pending, (state) => ({
        ...state,
        getPropertiesLoading: true,
        hasRequestedProperties: true,
      }))
      .addCase(getPropertiesThunk.fulfilled, (state, action) => ({
        ...state,
        getPropertiesLoading: false,
        properties: action.payload.data.properties,
      }))
      .addCase(getPropertiesThunk.rejected, (state) => ({
        ...state,
        getPropertiesLoading: false,
      }))
      .addCase(getPropertyByIdThunk.pending, (state) => ({
        ...state,
        getPropertyByIdLoading: true,
      }))
      .addCase(getPropertyByIdThunk.fulfilled, (state, action) => ({
        ...state,
        getPropertyByIdLoading: false,
        property: action.payload.data.property,
      }))
      .addCase(getPropertyByIdThunk.rejected, (state) => ({
        ...state,
        getPropertyByIdLoading: false,
        property: null,
      }))
      .addCase(getAvailabilityThunk.pending, (state) => ({
        ...state,
        getAvailabilityLoading: true,
      }))
      .addCase(getAvailabilityThunk.fulfilled, (state, action) => ({
        ...state,
        getAvailabilityLoading: false,
        availabilitySlots: action.payload.data.slots,
      }))
      .addCase(getAvailabilityThunk.rejected, (state) => ({
        ...state,
        getAvailabilityLoading: false,
        availabilitySlots: [],
      }));
  },
});

export const { setSearchFilters, resetSearchFilters, clearPropertyDetail } = propertiesSlice.actions;
export default propertiesSlice.reducer;
