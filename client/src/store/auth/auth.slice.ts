import { createSlice } from '@reduxjs/toolkit';
import { loginThunk, meThunk } from '@/store/auth/auth.thunk';
import type { AuthSliceInterface } from '@/store/auth/auth.types';

const initialState: AuthSliceInterface = {
  loginLoading: false,
  meLoading: false,
  hasRequestedMe: false,
  user: null,
  token: null,
  authError: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: () => initialState,
    clearAuthError: (state) => ({
      ...state,
      authError: null,
    }),
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => ({
        ...state,
        loginLoading: true,
        authError: null,
      }))
      .addCase(loginThunk.fulfilled, (state, action) => ({
        ...state,
        loginLoading: false,
        user: action.payload.data.user,
        token: action.payload.data.token,
        authError: null,
      }))
      .addCase(loginThunk.rejected, (state, action) => ({
        ...state,
        loginLoading: false,
        authError: action.payload?.data.message ?? 'Login failed',
      }))
      .addCase(meThunk.pending, (state) => ({
        ...state,
        meLoading: true,
        hasRequestedMe: true,
      }))
      .addCase(meThunk.fulfilled, (state, action) => ({
        ...state,
        meLoading: false,
        user: action.payload.data.user,
      }))
      .addCase(meThunk.rejected, (state) => ({
        ...state,
        meLoading: false,
        user: null,
        token: null,
      }));
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;
