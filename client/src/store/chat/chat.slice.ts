import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  getMessagesThunk,
  getSessionThunk,
  sendMessageThunk,
  askListerThunk,
  bookSlotThunk,
} from '@/store/chat/chat.thunk';
import type { ChatSliceInterface, IChatMessagesPagination, ISessionMessagesCache } from '@/store/chat/chat.types';
import {
  CHAT_MESSAGES_FETCH_INITIAL_KEY,
  getMessagesFetchKey,
  PENDING_USER_MESSAGE_ID_PREFIX,
} from '@/store/chat/chat.types';
import type { IChatMessage } from '@/store/types';

const initialState: ChatSliceInterface = {
  getSessionLoading: false,
  hasRequestedSession: false,
  session: null,
  getSessionError: null,
  getMessagesLoading: false,
  getOlderMessagesLoading: false,
  hasRequestedMessages: false,
  messages: [],
  messagesPagination: null,
  getMessagesError: null,
  sessionMessagesCache: {},
  sendMessageLoading: false,
  sendMessageError: null,
  askListerLoading: false,
  askListerError: null,
  bookSlotLoading: false,
  bookSlotId: null,
  bookSlotError: null,
  lastTurn: null,
  showDebugStrip: false,
};

function isPendingUserMessage(message: IChatMessage): boolean {
  return message.id.startsWith(PENDING_USER_MESSAGE_ID_PREFIX);
}

function mergeMessagesByCreatedAt(messages: IChatMessage[]): IChatMessage[] {
  const byId = new Map<string, IChatMessage>();
  for (const message of messages) {
    byId.set(message.id, message);
  }
  return Array.from(byId.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function createPendingUserMessage(sessionId: string, content: string): IChatMessage {
  return {
    id: `${PENDING_USER_MESSAGE_ID_PREFIX}${Date.now()}`,
    sessionId,
    role: 'USER',
    content,
    answerStatus: null,
    actions: null,
    metadata: null,
    createdAt: new Date().toISOString(),
  };
}

function updateSessionCache(
  cache: Record<string, ISessionMessagesCache>,
  sessionId: string,
  messages: IChatMessage[],
  pagination: IChatMessagesPagination | null,
  fetchKey: string,
): Record<string, ISessionMessagesCache> {
  const existing = cache[sessionId];
  const fetchedKeys = existing?.fetchedKeys.includes(fetchKey)
    ? existing.fetchedKeys
    : [...(existing?.fetchedKeys ?? []), fetchKey];

  return {
    ...cache,
    [sessionId]: {
      messages: mergeMessagesByCreatedAt(messages),
      pagination,
      fetchedKeys,
    },
  };
}

function setSessionCacheMessages(
  cache: Record<string, ISessionMessagesCache>,
  sessionId: string,
  messages: IChatMessage[],
  pagination: IChatMessagesPagination | null,
): Record<string, ISessionMessagesCache> {
  const existing = cache[sessionId];

  return {
    ...cache,
    [sessionId]: {
      messages: mergeMessagesByCreatedAt(messages),
      pagination,
      fetchedKeys: existing?.fetchedKeys ?? [],
    },
  };
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    toggleDebugStrip: (state) => ({
      ...state,
      showDebugStrip: !state.showDebugStrip,
    }),
    clearChatState: (state) => ({
      ...initialState,
      sessionMessagesCache: state.sessionMessagesCache,
    }),
    clearSendMessageError: (state) => ({
      ...state,
      sendMessageError: null,
    }),
    hydrateMessagesFromCache: (state, action: PayloadAction<{ sessionId: string }>) => {
      const cached = state.sessionMessagesCache[action.payload.sessionId];
      if (!cached) {
        return state;
      }

      return {
        ...state,
        messages: cached.messages,
        messagesPagination: cached.pagination,
        hasRequestedMessages: cached.fetchedKeys.includes(CHAT_MESSAGES_FETCH_INITIAL_KEY),
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getSessionThunk.pending, (state) => ({
        ...state,
        getSessionLoading: true,
        hasRequestedSession: true,
        getSessionError: null,
      }))
      .addCase(getSessionThunk.fulfilled, (state, action) => ({
        ...state,
        getSessionLoading: false,
        session: action.payload.data.session,
        getSessionError: null,
      }))
      .addCase(getSessionThunk.rejected, (state, action) => ({
        ...state,
        getSessionLoading: false,
        session: null,
        getSessionError: action.payload?.data.message ?? 'Failed to open chat session',
      }))
      .addCase(getMessagesThunk.pending, (state, action) => {
        const isOlderFetch = Boolean(action.meta.arg.before);
        return {
          ...state,
          getMessagesLoading: isOlderFetch ? state.getMessagesLoading : true,
          getOlderMessagesLoading: isOlderFetch,
          hasRequestedMessages: isOlderFetch ? state.hasRequestedMessages : true,
          getMessagesError: null,
        };
      })
      .addCase(getMessagesThunk.fulfilled, (state, action) => {
        const { sessionId, before } = action.meta.arg;
        const fetchKey = getMessagesFetchKey(before);
        const incoming = action.payload.data.messages;
        const pagination = action.payload.data.pagination;
        const merged = before
          ? mergeMessagesByCreatedAt([...incoming, ...state.messages])
          : mergeMessagesByCreatedAt(incoming);

        return {
          ...state,
          getMessagesLoading: false,
          getOlderMessagesLoading: false,
          messages: merged,
          messagesPagination: pagination,
          getMessagesError: null,
          sessionMessagesCache: updateSessionCache(
            state.sessionMessagesCache,
            sessionId,
            merged,
            pagination,
            fetchKey,
          ),
        };
      })
      .addCase(getMessagesThunk.rejected, (state, action) => ({
        ...state,
        getMessagesLoading: false,
        getOlderMessagesLoading: false,
        getMessagesError: action.payload?.data.message ?? 'Failed to load messages',
      }))
      .addCase(sendMessageThunk.pending, (state, action) => {
        const sessionId = action.meta.arg.sessionId;
        const pendingUserMessage = createPendingUserMessage(sessionId, action.meta.arg.content);
        const messages = [...state.messages, pendingUserMessage];

        return {
          ...state,
          sendMessageLoading: true,
          sendMessageError: null,
          messages,
          sessionMessagesCache: setSessionCacheMessages(
            state.sessionMessagesCache,
            sessionId,
            messages,
            state.messagesPagination,
          ),
        };
      })
      .addCase(sendMessageThunk.fulfilled, (state, action) => {
        const sessionId = action.meta.arg.sessionId;
        const messages = [...state.messages, action.payload.data.message];
        const pagination = state.messagesPagination
          ? {
              ...state.messagesPagination,
              total: state.messagesPagination.total + 2,
              newestMessageId: action.payload.data.message.id,
            }
          : state.messagesPagination;

        return {
          ...state,
          sendMessageLoading: false,
          sendMessageError: null,
          messages,
          messagesPagination: pagination,
          lastTurn: action.payload.data,
          sessionMessagesCache: setSessionCacheMessages(
            state.sessionMessagesCache,
            sessionId,
            messages,
            pagination,
          ),
        };
      })
      .addCase(sendMessageThunk.rejected, (state, action) => {
        const sessionId = action.meta.arg.sessionId;
        const messages = state.messages.filter((message) => !isPendingUserMessage(message));

        return {
          ...state,
          sendMessageLoading: false,
          sendMessageError: action.payload?.data.message ?? 'Failed to send message',
          messages,
          sessionMessagesCache: setSessionCacheMessages(
            state.sessionMessagesCache,
            sessionId,
            messages,
            state.messagesPagination,
          ),
        };
      })
      .addCase(askListerThunk.pending, (state) => ({
        ...state,
        askListerLoading: true,
        askListerError: null,
      }))
      .addCase(askListerThunk.fulfilled, (state, action) => ({
        ...state,
        askListerLoading: false,
        askListerError: null,
        lastTurn: action.payload.data,
      }))
      .addCase(askListerThunk.rejected, (state, action) => ({
        ...state,
        askListerLoading: false,
        askListerError: action.payload?.data.message ?? 'Failed to send question to lister',
      }))
      .addCase(bookSlotThunk.pending, (state, action) => ({
        ...state,
        bookSlotLoading: true,
        bookSlotId: action.meta.arg.slotId,
        bookSlotError: null,
      }))
      .addCase(bookSlotThunk.fulfilled, (state, action) => ({
        ...state,
        bookSlotLoading: false,
        bookSlotId: null,
        bookSlotError: null,
        lastTurn: action.payload.data,
      }))
      .addCase(bookSlotThunk.rejected, (state, action) => ({
        ...state,
        bookSlotLoading: false,
        bookSlotId: null,
        bookSlotError: action.payload?.data.message ?? 'Failed to book viewing',
      }));
  },
});

export const { toggleDebugStrip, clearChatState, clearSendMessageError, hydrateMessagesFromCache } =
  chatSlice.actions;
export default chatSlice.reducer;
