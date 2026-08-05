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
    condition: (_, { getState }) => !getState().auth.meLoading,
  },
);
