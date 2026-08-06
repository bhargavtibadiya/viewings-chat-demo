import { axiosInstance } from '@/utils/api/axiosInstance';
import { ROUTES } from '@/utils/helpers/routes';
import type { ApiSuccessResponse } from '@/store/types';
import type {
  ILoginThunkPayload,
  ILoginThunkResponse,
  IMeThunkResponse,
} from '@/store/auth/auth.types';

export const authService = {
  /**
   * Authenticates a user with email and password credentials.
   *
   * @param data - Email and password credentials
   * @returns The API response containing the authenticated user and token
   */
  login: (data: ILoginThunkPayload) =>
    axiosInstance.post<ILoginThunkResponse>(ROUTES.AUTH.LOGIN, data),

  /**
   * Retrieves the current authenticated user's profile.
   *
   * @returns The API response containing the authenticated user
   */
  me: () => axiosInstance.get<IMeThunkResponse>(ROUTES.AUTH.ME),
};

export type { ApiSuccessResponse };
