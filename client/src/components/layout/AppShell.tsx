import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader } from '@/components/ui';
import { AppNavbar } from '@/components/layout/AppNavbar';
import { useSessionStatus } from '@/hooks/use-session-status';

interface AppShellProps {
  onOpenSearch?: () => void;
}

export function AppShell({ onOpenSearch }: AppShellProps): React.ReactElement {
  const location = useLocation();
  const sessionStatus = useSessionStatus();

  if (sessionStatus === 'restoring') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-base)]">
        <Loader size="lg" label="Checking session" />
      </div>
    );
  }

  if (sessionStatus === 'unauthenticated') {
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
