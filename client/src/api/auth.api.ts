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
   * @param data Email and password credentials
   */
  login: (data: ILoginThunkPayload) =>
    axiosInstance.post<ILoginThunkResponse>(ROUTES.AUTH.LOGIN, data),

  /**
   * Fetch the current authenticated user profile
   */
  me: () => axiosInstance.get<IMeThunkResponse>(ROUTES.AUTH.ME),
};

export type { ApiSuccessResponse };
