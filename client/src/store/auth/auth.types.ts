import type { ApiSuccessResponse, IUser } from '@/store/types';

// --- LOGIN THUNK TYPES ---

export interface ILoginThunkPayload {
  email: string;
  password: string;
}

export interface ILoginThunkResponseData {
  user: IUser;
  token: string;
}

export type ILoginThunkResponse = ApiSuccessResponse<ILoginThunkResponseData>;

// --- ME THUNK TYPES ---

export interface IMeThunkResponseData {
  user: IUser;
}

export type IMeThunkResponse = ApiSuccessResponse<IMeThunkResponseData>;

// --- AUTH SLICE ---

export interface AuthSliceInterface {
  loginLoading: boolean;
  meLoading: boolean;
  hasRequestedMe: boolean;
  user: IUser | null;
  token: string | null;
  authError: string | null;
}
