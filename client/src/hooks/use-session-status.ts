import { useAppSelector } from '@/store/store';

export type SessionStatus = 'restoring' | 'unauthenticated' | 'ready';

/**
 * Single source of truth for whether authenticated data requests may run yet.
 * A persisted token is only trustworthy once `me` has confirmed it.
 */
export function useSessionStatus(): SessionStatus {
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);
  const meLoading = useAppSelector((state) => state.auth.meLoading);
  const hasRequestedMe = useAppSelector((state) => state.auth.hasRequestedMe);

  const hasToken = token !== null && token.length > 0;

  if (hasToken && (!hasRequestedMe || meLoading)) {
    return 'restoring';
  }

  if (!hasToken || !user) {
    return 'unauthenticated';
  }

  return 'ready';
}
