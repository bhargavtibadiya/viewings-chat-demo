import type { ApiSuccessResponse, IUser } from '@/store/types';

// ============================================================================
// LOGIN THUNK TYPES
// Request and response contracts for credential authentication
// ============================================================================

export interface ILoginThunkPayload {
  email: string;
  password: string;
}

export interface ILoginThunkResponseData {
  user: IUser;
  token: string;
}

export type ILoginThunkResponse = ApiSuccessResponse<ILoginThunkResponseData>;

// ============================================================================
// PROFILE THUNK TYPES
// Response contract for restoring the authenticated user's profile
// ============================================================================

export interface IMeThunkResponseData {
  user: IUser;
}

export type IMeThunkResponse = ApiSuccessResponse<IMeThunkResponseData>;

// ============================================================================
// AUTHENTICATION SLICE STATE
// Client-side state used to restore and manage the active user session
// ============================================================================

export interface AuthSliceInterface {
  loginLoading: boolean;
  meLoading: boolean;
  hasRequestedMe: boolean;
  user: IUser | null;
  token: string | null;
  authError: string | null;
}
