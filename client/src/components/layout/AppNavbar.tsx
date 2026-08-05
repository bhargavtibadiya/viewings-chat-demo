import { Link, NavLink } from 'react-router-dom';
import { Building2, Search } from 'lucide-react';
import { Button } from '@/components/ui';
import { UserMenu } from '@/components/layout/UserMenu';
import { cn } from '@/utils/helpers/cn';

interface AppNavbarProps {
  onOpenSearch?: () => void;
}

export function AppNavbar({ onOpenSearch }: AppNavbarProps): React.ReactElement {
  return (
    <header className="sticky top-0 z-[var(--z-sticky)] border-b border-[var(--color-border-light)] bg-[var(--color-bg-base)]">
      <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2.5 no-underline hover:no-underline"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-primary)] text-[var(--color-text-inverse)]">
            <Building2 className="h-4 w-4" strokeWidth={1.5} />
          </span>
          <span className="font-display text-2xl font-semibold leading-none text-[var(--color-primary)]">
            Viewings
          </span>
        </Link>

        <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-0.5 md:flex">
          <NavLinkItem to="/" label="Home" end />
          <NavLinkItem to="/bookings" label="Bookings" />
        </nav>

        <div className="flex shrink-0 items-center gap-1.5">
          {onOpenSearch && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenSearch}
              leftIcon={<Search className="h-3 w-3" strokeWidth={1.5} />}
              className="min-h-[28px] px-2 py-1 text-[var(--text-2xs)] tracking-[0.06em]"
            >
              <span className="hidden sm:inline">Search</span>
              <span className="hidden lg:inline"> ⌘K</span>
            </Button>
          )}
          <UserMenu />
        </div>
      </div>

      <nav className="flex items-center justify-center gap-1 border-t border-[var(--color-border-hairline)] px-4 py-1 md:hidden">
        <NavLinkItem to="/" label="Home" end />
        <NavLinkItem to="/bookings" label="Bookings" />
      </nav>
    </header>
  );
}

interface NavLinkItemProps {
  to: string;
  label: string;
  end?: boolean;
}

function NavLinkItem({ to, label, end = false }: NavLinkItemProps): React.ReactElement {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'inline-flex items-center rounded-[var(--radius-sm)] px-2 py-1 text-[var(--text-2xs)] font-bold uppercase tracking-[0.06em] no-underline transition-colors hover:no-underline',
          isActive
            ? 'bg-[var(--color-bg-secondary)] text-[var(--color-primary)]'
            : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)]',
        )
      }
    >
      {label}
    </NavLink>
  );
}
