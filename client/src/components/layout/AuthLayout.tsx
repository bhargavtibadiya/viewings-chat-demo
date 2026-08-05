import { Navigate, useLocation } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { useAppSelector } from '@/store/store';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps): React.ReactElement {
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);

  if (user && token) {
    const redirectPath =
      typeof location.state === 'object' &&
      location.state !== null &&
      'from' in location.state &&
      typeof location.state.from === 'string'
        ? location.state.from
        : '/';
    return <Navigate to={redirectPath} replace />;
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col bg-[var(--color-primary)] lg:flex">
        <div className="flex flex-1 flex-col items-center justify-center px-8 py-10 text-center text-[var(--color-text-inverse)]">
          <div className="max-w-md">
            <div className="mb-6 flex items-center justify-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-text-inverse)] text-[var(--color-primary)]">
                <Building2 className="h-5 w-5" strokeWidth={1.5} aria-hidden="true" />
              </span>
              <span className="font-display text-3xl font-semibold text-[var(--color-text-inverse)]">
                Viewings
              </span>
            </div>
            <p className="eyebrow text-[var(--color-primary-light)]">Marketplace demo</p>
            <h1 className="mt-4 font-display text-3xl font-light leading-tight text-[var(--color-text-inverse)]">
              Listing chat that stays grounded
            </h1>
            <p className="mt-4 text-[var(--text-md)] leading-relaxed text-[var(--color-primary-light)]">
              Browse Auckland rentals and sales, open property chat, and walk evidence cases with verified data only.
            </p>
          </div>
        </div>
        <p className="pb-6 text-center text-[var(--text-sm)] text-[var(--color-primary-light)]">
          Pacific/Auckland timezone · Editorial Theme 02
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-[var(--color-bg-base)] px-4 py-8 sm:px-8">
        <div className="w-full max-w-sm">{children}</div>
      </section>
    </div>
  );
}
