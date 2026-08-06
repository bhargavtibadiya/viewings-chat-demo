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

// ============================================================================
// CHAT THUNKS
// Coordinates session retrieval, messaging, lister questions, and slot bookings
// ============================================================================

/**
 * Retrieves or creates the chat session for a property.
 *
 * @param data - Property identifier
 * @returns A dispatchable action resolving with the session or an API error
 */
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
    // [PERF] Suppress duplicate session requests while the current request is pending.
    condition: (_, { getState }) => !getState().chat.getSessionLoading,
  },
);

/**
 * Retrieves an initial or historical page of messages for a chat session.
 *
 * @param data - Session identifier and optional pagination configuration
 * @returns A dispatchable action resolving with messages or an API error
 */
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

      // [PERF] Reuse pages already fetched for this session unless the caller explicitly refreshes them.
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

/**
 * Sends a user message to an open chat session.
 *
 * @param data - Session identifier and message content
 * @returns A dispatchable action resolving with the completed turn or an API error
 */
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

/**
 * Escalates a chat question to the property's lister.
 *
 * @param data - Session identifier, question, and optional canonical attributes
 * @returns A dispatchable action resolving with the completed turn or an API error
 */
export const askListerThunk = createAsyncThunk<
  IAskListerThunkResponse,
  IAskListerThunkPayload,
  { rejectValue: ApiErrorData; state: RootState }
>(
  'chat/askLister',
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await chatService.askLister(data);
      // [WHY] The server may append messages for this action, so refresh the session transcript.
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

/**
 * Books an available viewing slot from a chat session.
 *
 * @param data - Session and availability slot identifiers
 * @returns A dispatchable action resolving with the completed turn or an API error
 */
export const bookSlotThunk = createAsyncThunk<
  IBookSlotThunkResponse,
  IBookSlotThunkPayload,
  { rejectValue: ApiErrorData; state: RootState }
>(
  'chat/bookSlot',
  async (data, { rejectWithValue, dispatch }) => {
    try {
      const response = await chatService.bookSlot(data);
      // [WHY] Booking can add a confirmation message that must appear in the transcript.
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
