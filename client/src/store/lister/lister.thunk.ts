import { createAsyncThunk } from '@reduxjs/toolkit';
import { listerService } from '@/api/lister.api';
import { extractApiError } from '@/utils/helpers/extractApiError';
import { getErrorMessage } from '@/utils/helpers/getErrorMessage';
import type { ApiErrorData } from '@/store/types';
import type { RootState } from '@/store/rootReducer';
import type {
  IGetQuestionsThunkResponse,
  IAnswerQuestionThunkPayload,
  IAnswerQuestionThunkResponse,
} from '@/store/lister/lister.types';

// ============================================================================
// LISTER QUESTION THUNKS
// Retrieves escalated questions and records lister responses
// ============================================================================

/**
 * Retrieves questions available to the authenticated lister.
 *
 * @returns A dispatchable action resolving with lister questions or an API error
 */
export const getQuestionsThunk = createAsyncThunk<
  IGetQuestionsThunkResponse,
  void,
  { rejectValue: ApiErrorData; state: RootState }
>(
  'lister/getQuestions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await listerService.getQuestions();
      return response.data;
    } catch (error: unknown) {
      const fallback = getErrorMessage(error, 'Failed to load questions');
      return rejectWithValue({ data: extractApiError(error, fallback) });
    }
  },
  {
    // [PERF] Suppress duplicate list requests while questions are already loading.
    condition: (_, { getState }) => !getState().lister.getQuestionsLoading,
  },
);

/**
 * Submits an answer to an escalated lister question.
 *
 * @param data - Question identifier and answer text
 * @returns A dispatchable action resolving with the updated question or an API error
 */
export const answerQuestionThunk = createAsyncThunk<
  IAnswerQuestionThunkResponse,
  IAnswerQuestionThunkPayload,
  { rejectValue: ApiErrorData }
>('lister/answerQuestion', async (data, { rejectWithValue }) => {
  try {
    const response = await listerService.answerQuestion(data);
    return response.data;
  } catch (error: unknown) {
    const fallback = getErrorMessage(error, 'Failed to submit answer');
    return rejectWithValue({ data: extractApiError(error, fallback) });
  }
});
