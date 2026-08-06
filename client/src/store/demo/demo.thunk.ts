import { createAsyncThunk } from '@reduxjs/toolkit';
import { demoService } from '@/api/demo.api';
import { extractApiError } from '@/utils/helpers/extractApiError';
import { getErrorMessage } from '@/utils/helpers/getErrorMessage';
import type { ApiErrorData } from '@/store/types';
import type {
  IGetTurnLogsThunkPayload,
  IGetTurnLogsThunkResponse,
} from '@/store/demo/demo.types';

/**
 * Retrieves debug turn logs for a chat session.
 *
 * @param data - Session identifier
 * @returns A dispatchable action resolving with turn logs or an API error
 */
export const getTurnLogsThunk = createAsyncThunk<
  IGetTurnLogsThunkResponse,
  IGetTurnLogsThunkPayload,
  { rejectValue: ApiErrorData }
>('demo/getTurnLogs', async (data, { rejectWithValue }) => {
  try {
    const response = await demoService.getTurnLogs(data);
    return response.data;
  } catch (error: unknown) {
    const fallback = getErrorMessage(error, 'Failed to load turn logs');
    return rejectWithValue({ data: extractApiError(error, fallback) });
  }
});
