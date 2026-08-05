import { createAsyncThunk } from '@reduxjs/toolkit';
import { chatService } from '@/api/chat.api';
import { extractApiError } from '@/utils/helpers/extractApiError';
import { getErrorMessage } from '@/utils/helpers/getErrorMessage';
import type { ApiErrorData } from '@/store/types';
import type { RootState } from '@/store/rootReducer';
import type {
  IGetSessionThunkPayload,
  IGetSessionThunkResponse,
  IGetMessagesThunkPayload,
  IGetMessagesThunkResponse,
  ISendMessageThunkPayload,
  ISendMessageThunkResponse,
} from '@/store/chat/chat.types';

export const getSessionThunk = createAsyncThunk<
  IGetSessionThunkResponse,
  IGetSessionThunkPayload,
  { rejectValue: ApiErrorData; state: RootState }
>('chat/getSession', async (data, { rejectWithValue }) => {
  try {
    const response = await chatService.getSession(data);
    return response.data;
  } catch (error: unknown) {
    const fallback = getErrorMessage(error, 'Failed to open chat session');
    return rejectWithValue({ data: extractApiError(error, fallback) });
  }
});

export const getMessagesThunk = createAsyncThunk<
  IGetMessagesThunkResponse,
  IGetMessagesThunkPayload,
  { rejectValue: ApiErrorData; state: RootState }
>(
  'chat/getMessages',
  async (data, { rejectWithValue }) => {
    try {
      const response = await chatService.getMessages(data);
      return response.data;
    } catch (error: unknown) {
      const fallback = getErrorMessage(error, 'Failed to load messages');
      return rejectWithValue({ data: extractApiError(error, fallback) });
    }
  },
  {
    condition: (_, { getState }) => !getState().chat.getMessagesLoading,
  },
);

export const sendMessageThunk = createAsyncThunk<
  ISendMessageThunkResponse,
  ISendMessageThunkPayload,
  { rejectValue: ApiErrorData; state: RootState }
>(
  'chat/sendMessage',
  async (data, { rejectWithValue }) => {
    try {
      const response = await chatService.sendMessage(data);
      return response.data;
    } catch (error: unknown) {
      const fallback = getErrorMessage(error, 'Failed to send message');
      return rejectWithValue({ data: extractApiError(error, fallback) });
    }
  },
  {
    condition: (_, { getState }) => !getState().chat.sendMessageLoading,
  },
);
