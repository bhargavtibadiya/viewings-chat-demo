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

// ============================================================================
// PROPERTY THUNKS
// Retrieves listing search results, property details, and availability
// ============================================================================

/**
 * Retrieves properties matching the optional search filters.
 *
 * @param data - Optional property search filters
 * @returns A dispatchable action resolving with matching properties or an API error
 */
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
    // [PERF] Suppress duplicate search requests while the current search is pending.
    condition: (_, { getState }) => !getState().properties.getPropertiesLoading,
  },
);

/**
 * Retrieves detailed information for a property.
 *
 * @param data - Property identifier
 * @returns A dispatchable action resolving with property detail or an API error
 */
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

/**
 * Retrieves viewing availability for a property.
 *
 * @param data - Property identifier
 * @returns A dispatchable action resolving with availability slots or an API error
 */
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
