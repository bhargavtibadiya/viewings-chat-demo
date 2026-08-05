import { createAsyncThunk } from '@reduxjs/toolkit';
import { propertiesService } from '@/api/properties.api';
import { extractApiError } from '@/utils/helpers/extractApiError';
import { getErrorMessage } from '@/utils/helpers/getErrorMessage';
import type { ApiErrorData } from '@/store/types';
import type { RootState } from '@/store/rootReducer';
import type {
  IGetPropertiesThunkPayload,
  IGetPropertiesThunkResponse,
  IGetPropertyByIdThunkPayload,
  IGetPropertyByIdThunkResponse,
  IGetAvailabilityThunkPayload,
  IGetAvailabilityThunkResponse,
} from '@/store/properties/properties.types';

export const getPropertiesThunk = createAsyncThunk<
  IGetPropertiesThunkResponse,
  IGetPropertiesThunkPayload | void,
  { rejectValue: ApiErrorData; state: RootState }
>(
  'properties/getProperties',
  async (data, { rejectWithValue }) => {
    try {
      const response = await propertiesService.getProperties(data ?? undefined);
      return response.data;
    } catch (error: unknown) {
      const fallback = getErrorMessage(error, 'Failed to load properties');
      return rejectWithValue({ data: extractApiError(error, fallback) });
    }
  },
  {
    condition: (_, { getState }) => !getState().properties.getPropertiesLoading,
  },
);

export const getPropertyByIdThunk = createAsyncThunk<
  IGetPropertyByIdThunkResponse,
  IGetPropertyByIdThunkPayload,
  { rejectValue: ApiErrorData }
>('properties/getPropertyById', async (data, { rejectWithValue }) => {
  try {
    const response = await propertiesService.getPropertyById(data);
    return response.data;
  } catch (error: unknown) {
    const fallback = getErrorMessage(error, 'Failed to load property');
    return rejectWithValue({ data: extractApiError(error, fallback) });
  }
});

export const getAvailabilityThunk = createAsyncThunk<
  IGetAvailabilityThunkResponse,
  IGetAvailabilityThunkPayload,
  { rejectValue: ApiErrorData }
>('properties/getAvailability', async (data, { rejectWithValue }) => {
  try {
    const response = await propertiesService.getAvailability(data);
    return response.data;
  } catch (error: unknown) {
    const fallback = getErrorMessage(error, 'Failed to load availability');
    return rejectWithValue({ data: extractApiError(error, fallback) });
  }
});
