import axios from 'axios';
import { getClientEnv } from '@/utils/helpers/env-validation';
import { ROUTES } from '@/utils/helpers/routes';

const AUTH_ENDPOINTS = [ROUTES.AUTH.LOGIN, ROUTES.AUTH.ME];

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

const { apiUrl } = getClientEnv();

export const axiosInstance = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use((config) => {
  if (authToken !== null && authToken.length > 0) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const requestUrl = error.config?.url ?? '';

    const isAuthEndpoint = AUTH_ENDPOINTS.some((endpoint) => requestUrl.includes(endpoint));
    const isLoginPage = window.location.pathname === '/login';

    if (status === 401 && !isAuthEndpoint && !isLoginPage) {
      setAuthToken(null);
      window.location.assign('/login');
    }

    return Promise.reject(error);
  },
);
