import { cn } from '@/utils/helpers/cn';
import type { BadgeVariant, SemanticStatus } from '@/components/ui/ui.types';

interface BadgeProps {
  variant?: BadgeVariant;
  status?: SemanticStatus;
  size?: 'xs' | 'sm' | 'md';
  dot?: boolean;
  count?: number;
  onRemove?: () => void;
  children?: React.ReactNode;
  className?: string;
}

const statusClasses: Record<SemanticStatus, { solid: string; outline: string; ghost: string }> = {
  success: {
    solid: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
    outline: 'border border-[var(--color-success)] text-[var(--color-success)] bg-transparent',
    ghost: 'bg-[var(--color-bg-secondary)] text-[var(--color-success)]',
  },
  warning: {
    solid: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
    outline: 'border border-[var(--color-warning)] text-[var(--color-warning)] bg-transparent',
    ghost: 'bg-[var(--color-bg-secondary)] text-[var(--color-warning)]',
  },
  error: {
    solid: 'bg-[var(--color-error-bg)] text-[var(--color-error)]',
    outline: 'border border-[var(--color-error)] text-[var(--color-error)] bg-transparent',
    ghost: 'bg-[var(--color-bg-secondary)] text-[var(--color-error)]',
  },
  info: {
    solid: 'bg-[var(--color-info-bg)] text-[var(--color-info)]',
    outline: 'border border-[var(--color-info)] text-[var(--color-info)] bg-transparent',
    ghost: 'bg-[var(--color-bg-secondary)] text-[var(--color-info)]',
  },
  neutral: {
    solid: 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]',
    outline: 'border border-[var(--color-border-light)] text-[var(--color-text-muted)] bg-transparent',
    ghost: 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]',
  },
};

export function Badge({
  variant = 'solid',
  status = 'neutral',
  size = 'sm',
  dot = false,
  count,
  onRemove,
  children,
  className,
}: BadgeProps): React.ReactElement {
  const appearance = variant === 'dot' ? 'solid' : variant;
  const styles = statusClasses[status][appearance === 'solid' ? 'solid' : appearance === 'outline' ? 'outline' : 'ghost'];

  return (
    <span
      className={cn(
        'font-body inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] font-bold uppercase tracking-[0.06em]',
        size === 'xs' ? 'px-1.5 py-0.5 text-[var(--text-2xs)] tracking-[0.05em]' : size === 'sm' ? 'px-2 py-0.5 text-[var(--text-2xs)]' : 'px-3 py-1 text-[var(--text-sm)]',
        styles,
        className,
      )}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full bg-current"
          aria-hidden="true"
        />
      )}
      {typeof count === 'number' ? count : children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 text-[var(--text-xs)] uppercase tracking-[0.06em] text-inherit"
          aria-label="Remove"
        >
          ×
        </button>
      )}
    </span>
  );
}
