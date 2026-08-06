import { createAsyncThunk } from '@reduxjs/toolkit';
import { authService } from '@/api/auth.api';
import { extractApiError } from '@/utils/helpers/extractApiError';
import { getErrorMessage } from '@/utils/helpers/getErrorMessage';
import type { ApiErrorData } from '@/store/types';
import type { RootState } from '@/store/rootReducer';
import type {
  ILoginThunkPayload,
  ILoginThunkResponse,
  IMeThunkResponse,
} from '@/store/auth/auth.types';

// ============================================================================
// AUTHENTICATION THUNKS
// Coordinates credential exchange and persisted-session profile restoration
// ============================================================================

/**
 * Authenticates a user with their submitted credentials.
 *
 * @param data - Email and password credentials
 * @returns A dispatchable action resolving with authentication data or an API error
 */
export const loginThunk = createAsyncThunk<
  ILoginThunkResponse,
  ILoginThunkPayload,
  { rejectValue: ApiErrorData }
>('auth/login', async (data, { rejectWithValue }) => {
  try {
    const response = await authService.login(data);
    return response.data;
  } catch (error: unknown) {
    const fallback = getErrorMessage(error, 'Login failed');
    return rejectWithValue({ data: extractApiError(error, fallback) });
  }
});

/**
 * Retrieves the profile associated with the current authentication token.
 *
 * @returns A dispatchable action resolving with the current user or an API error
 */
export const meThunk = createAsyncThunk<
  IMeThunkResponse,
  void,
  { rejectValue: ApiErrorData; state: RootState }
>(
  'auth/me',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.me();
      return response.data;
    } catch (error: unknown) {
      const fallback = getErrorMessage(error, 'Failed to load profile');
      return rejectWithValue({ data: extractApiError(error, fallback) });
    }
  },
  {
    // [PERF] Suppress duplicate profile requests while the current request is pending.
    condition: (_, { getState }) => !getState().auth.meLoading,
  },
);
