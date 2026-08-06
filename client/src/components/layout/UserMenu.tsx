import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, FlaskConical, LogOut, MessageSquare, User } from 'lucide-react';
import { cn } from '@/utils/helpers/cn';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { logout } from '@/store/auth/auth.slice';
import { setAuthToken } from '@/utils/api/axiosInstance';

/**
 * Renders the current user's role-aware account menu.
 *
 * @returns The account menu, or nothing until a user is available
 */
export function UserMenu(): React.ReactElement | null {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event: MouseEvent): void => {
      const target = event.target;
      if (target instanceof Node && containerRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };

    // [WHY] listen on the document so clicks outside the menu close it consistently.
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  if (!user) return null;

  /** Clears local authentication state before returning the user to login. */
  const handleLogout = (): void => {
    dispatch(logout());
    setAuthToken(null);
    navigate('/login');
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'inline-flex min-h-[34px] max-w-[200px] items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-light)] bg-[var(--color-bg-surface)] px-2.5 py-1.5 text-[var(--text-sm)] text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-secondary)]',
        )}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <User className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-muted)]" strokeWidth={1.5} />
        <span className="truncate font-semibold">{user.name}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-muted)]" strokeWidth={1.5} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-[var(--z-dropdown)] min-w-[180px] rounded-[var(--radius-sm)] border border-[var(--color-border-light)] bg-[var(--color-bg-surface)] py-1 shadow-[var(--shadow-md)]"
        >
          {(user.role === 'LISTER' || user.role === 'DEMO_ADMIN') && (
            <MenuLink to="/lister/questions" icon={<MessageSquare className="h-3.5 w-3.5" />} label="Lister inbox" onNavigate={() => setOpen(false)} />
          )}
          {user.role === 'DEMO_ADMIN' && (
            <MenuLink to="/demo" icon={<FlaskConical className="h-3.5 w-3.5" />} label="Demo panel" onNavigate={() => setOpen(false)} />
          )}
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[var(--text-sm)] text-[var(--color-text-secondary)] no-underline transition-colors hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)]"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

interface MenuLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  onNavigate: () => void;
}

function MenuLink({ to, icon, label, onNavigate }: MenuLinkProps): React.ReactElement {
  return (
    <Link
      to={to}
      role="menuitem"
      onClick={onNavigate}
      className="flex items-center gap-2 px-3 py-2 text-[var(--text-sm)] text-[var(--color-text-secondary)] no-underline transition-colors hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)] hover:no-underline"
    >
      {icon}
      {label}
    </Link>
  );
}
