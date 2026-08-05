import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { getTurnLogsThunk } from '@/store/demo/demo.thunk';
import type { DemoSliceInterface } from '@/store/demo/demo.types';

const initialState: DemoSliceInterface = {
  getTurnLogsLoading: false,
  turnLogs: [],
  activeSessionId: null,
};

const demoSlice = createSlice({
  name: 'demo',
  initialState,
  reducers: {
    setActiveSessionId: (state, action: PayloadAction<string | null>) => ({
      ...state,
      activeSessionId: action.payload,
    }),
  },
  extraReducers: (builder) => {
    builder
      .addCase(getTurnLogsThunk.pending, (state) => ({
        ...state,
        getTurnLogsLoading: true,
      }))
      .addCase(getTurnLogsThunk.fulfilled, (state, action) => ({
        ...state,
        getTurnLogsLoading: false,
        turnLogs: action.payload.data.turns,
      }))
      .addCase(getTurnLogsThunk.rejected, (state) => ({
        ...state,
        getTurnLogsLoading: false,
        turnLogs: [],
      }));
  },
});

export const { setActiveSessionId } = demoSlice.actions;
export default demoSlice.reducer;
