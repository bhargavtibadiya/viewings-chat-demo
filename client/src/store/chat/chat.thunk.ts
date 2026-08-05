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
  IAskListerThunkPayload,
  IAskListerThunkResponse,
  IBookSlotThunkPayload,
  IBookSlotThunkResponse,
} from '@/store/chat/chat.types';
import { getMessagesFetchKey, CHAT_MESSAGES_DEFAULT_LIMIT } from '@/store/chat/chat.types';

export const getSessionThunk = createAsyncThunk<
  IGetSessionThunkResponse,
  IGetSessionThunkPayload,
  { rejectValue: ApiErrorData; state: RootState }
>(
  'chat/getSession',
  async (data, { rejectWithValue }) => {
    try {
      const response = await chatService.getSession(data);
      return response.data;
    } catch (error: unknown) {
      const fallback = getErrorMessage(error, 'Failed to open chat session');
      return rejectWithValue({ data: extractApiError(error, fallback) });
    }
  },
  {
    condition: (_, { getState }) => !getState().chat.getSessionLoading,
  },
);

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
    condition: (arg, { getState }) => {
      const state = getState().chat;
      const fetchKey = getMessagesFetchKey(arg.before);
      const cached = state.sessionMessagesCache[arg.sessionId];

      if (!arg.skipCache && cached?.fetchedKeys.includes(fetchKey)) {
        return false;
      }

      if (arg.before) {
        if (state.getOlderMessagesLoading) return false;
        if (!state.messagesPagination?.hasMoreOlder) return false;
      } else if (state.getMessagesLoading) {
        return false;
      }

      return true;
    },
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

export const askListerThunk = createAsyncThunk<
  IAskListerThunkResponse,
  IAskListerThunkPayload,
  { rejectValue: ApiErrorData; state: RootState }
>(
  'chat/askLister',
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await chatService.askLister(data);
      await dispatch(
        getMessagesThunk({
          sessionId: data.sessionId,
          limit: CHAT_MESSAGES_DEFAULT_LIMIT,
          skipCache: true,
        }),
      );
      return response.data;
    } catch (error: unknown) {
      const fallback = getErrorMessage(error, 'Failed to send question to lister');
      return rejectWithValue({ data: extractApiError(error, fallback) });
    }
  },
  {
    condition: (_, { getState }) => !getState().chat.askListerLoading,
  },
);

export const bookSlotThunk = createAsyncThunk<
  IBookSlotThunkResponse,
  IBookSlotThunkPayload,
  { rejectValue: ApiErrorData; state: RootState }
>(
  'chat/bookSlot',
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await chatService.bookSlot(data);
      await dispatch(
        getMessagesThunk({
          sessionId: data.sessionId,
          limit: CHAT_MESSAGES_DEFAULT_LIMIT,
          skipCache: true,
        }),
      );
      return response.data;
    } catch (error: unknown) {
      const fallback = getErrorMessage(error, 'Failed to book viewing');
      return rejectWithValue({ data: extractApiError(error, fallback) });
    }
  },
  {
    condition: (_, { getState }) => !getState().chat.bookSlotLoading,
  },
);
