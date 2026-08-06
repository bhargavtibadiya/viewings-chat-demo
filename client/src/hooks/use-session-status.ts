import { useAppSelector } from '@/store/store';

export type SessionStatus = 'restoring' | 'unauthenticated' | 'ready';

/**
 * Determines whether authenticated application data may be requested.
 *
 * @returns The current session restoration, unauthenticated, or ready status
 */
export function useSessionStatus(): SessionStatus {
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);
  const meLoading = useAppSelector((state) => state.auth.meLoading);
  const hasRequestedMe = useAppSelector((state) => state.auth.hasRequestedMe);

  // [SEC] A persisted token is not trusted until the profile request validates it.
  const hasToken = token !== null && token.length > 0;

  if (hasToken && (!hasRequestedMe || meLoading)) {
    return 'restoring';
  }

  if (!hasToken || !user) {
    return 'unauthenticated';
  }

  return 'ready';
}
