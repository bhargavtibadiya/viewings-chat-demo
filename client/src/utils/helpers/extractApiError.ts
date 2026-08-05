import type { ApiError } from '@/store/types';

interface ErrorWithResponse {
  response?: {
    data?: ApiError;
  };
}

function hasErrorResponse(error: unknown): error is ErrorWithResponse {
  if (typeof error !== 'object' || error === null) {
    return false;
  }
  return 'response' in error;
}

export function extractApiError(error: unknown, fallback: string): ApiError {
  if (hasErrorResponse(error)) {
    const data = error.response?.data;
    if (data && typeof data.message === 'string') {
      return data;
    }
  }

  return {
    success: false,
    message: fallback,
  };
}
