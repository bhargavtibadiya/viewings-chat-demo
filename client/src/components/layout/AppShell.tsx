import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader } from '@/components/ui';
import { AppNavbar } from '@/components/layout/AppNavbar';
import { useAppSelector } from '@/store/store';

interface AppShellProps {
  onOpenSearch?: () => void;
}

export function AppShell({ onOpenSearch }: AppShellProps): React.ReactElement {
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);
  const meLoading = useAppSelector((state) => state.auth.meLoading);
  const hasRequestedMe = useAppSelector((state) => state.auth.hasRequestedMe);
  const token = useAppSelector((state) => state.auth.token);
  const awaitingSessionRestore = token !== null && token.length > 0 && (!hasRequestedMe || meLoading);

  if (awaitingSessionRestore) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-base)]">
        <Loader size="lg" label="Checking session" />
      </div>
    );
  }

  if (!user && !token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)]">
      <AppNavbar onOpenSearch={onOpenSearch} />
      <main className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
