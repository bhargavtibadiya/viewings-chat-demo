import { createSlice } from '@reduxjs/toolkit';
import { getMessagesThunk, getSessionThunk, sendMessageThunk } from '@/store/chat/chat.thunk';
import type { ChatSliceInterface } from '@/store/chat/chat.types';

const initialState: ChatSliceInterface = {
  getSessionLoading: false,
  session: null,
  getMessagesLoading: false,
  hasRequestedMessages: false,
  messages: [],
  sendMessageLoading: false,
  lastTurn: null,
  showDebugStrip: true,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    toggleDebugStrip: (state) => ({
      ...state,
      showDebugStrip: !state.showDebugStrip,
    }),
    clearChatState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(getSessionThunk.pending, (state) => ({
        ...state,
        getSessionLoading: true,
      }))
      .addCase(getSessionThunk.fulfilled, (state, action) => ({
        ...state,
        getSessionLoading: false,
        session: action.payload.data.session,
      }))
      .addCase(getSessionThunk.rejected, (state) => ({
        ...state,
        getSessionLoading: false,
        session: null,
      }))
      .addCase(getMessagesThunk.pending, (state) => ({
        ...state,
        getMessagesLoading: true,
        hasRequestedMessages: true,
      }))
      .addCase(getMessagesThunk.fulfilled, (state, action) => ({
        ...state,
        getMessagesLoading: false,
        messages: action.payload.data.messages,
      }))
      .addCase(getMessagesThunk.rejected, (state) => ({
        ...state,
        getMessagesLoading: false,
      }))
      .addCase(sendMessageThunk.pending, (state) => ({
        ...state,
        sendMessageLoading: true,
      }))
      .addCase(sendMessageThunk.fulfilled, (state, action) => {
        const userMessage: typeof state.messages[number] = {
          id: `local-user-${Date.now()}`,
          sessionId: state.session?.id ?? '',
          role: 'USER',
          content: action.meta.arg.content,
          answerStatus: null,
          actions: null,
          metadata: null,
          createdAt: new Date().toISOString(),
        };

        return {
          ...state,
          sendMessageLoading: false,
          messages: [...state.messages, userMessage, action.payload.data.message],
          lastTurn: action.payload.data,
        };
      })
      .addCase(sendMessageThunk.rejected, (state) => ({
        ...state,
        sendMessageLoading: false,
      }));
  },
});

export const { toggleDebugStrip, clearChatState } = chatSlice.actions;
export default chatSlice.reducer;
