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
    condition: (_, { getState }) => !getState().lister.getQuestionsLoading,
  },
);

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
