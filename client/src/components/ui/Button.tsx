import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/helpers/cn';
import type { ButtonVariant, ComponentSize } from '@/components/ui/ui.types';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ComponentSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  iconOnly?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children?: React.ReactNode;
  className?: string;
  'aria-label'?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-btn-primary-bg)] text-[var(--color-btn-primary-text)] border border-transparent hover:bg-[var(--color-btn-primary-hover)] active:bg-[var(--color-primary-active)] [&_span]:text-[var(--color-btn-primary-text)] [&_svg]:text-[var(--color-btn-primary-text)]',
  secondary:
    'bg-transparent text-[var(--color-primary)] border border-[var(--color-primary)] hover:bg-[var(--color-btn-secondary-hover)] [&_svg]:text-[var(--color-primary)]',
  outline:
    'bg-transparent text-[var(--color-primary)] border border-[var(--color-primary)] hover:bg-[var(--color-btn-secondary-hover)] [&_svg]:text-[var(--color-primary)]',
  destructive:
    'bg-[var(--color-error)] text-[var(--color-text-inverse)] border border-transparent hover:opacity-90 [&_span]:text-[var(--color-text-inverse)] [&_svg]:text-[var(--color-text-inverse)]',
  ghost:
    'bg-transparent text-[var(--color-btn-ghost-text)] border border-[var(--color-btn-ghost-border)] hover:bg-[var(--color-btn-ghost-hover)] hover:text-[var(--color-text-primary)] [&_svg]:text-current',
  text: 'bg-transparent text-[var(--color-primary)] border border-transparent hover:underline [&_svg]:text-[var(--color-primary)]',
};

const sizeClasses: Record<ComponentSize, string> = {
  sm: 'min-h-[30px] px-3 py-1.5 text-[var(--text-xs)]',
  md: 'min-h-[36px] px-4 py-2 text-[var(--text-sm)]',
  lg: 'min-h-[42px] px-6 py-2.5 text-[var(--text-md)]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    fullWidth = false,
    iconOnly = false,
    leftIcon,
    rightIcon,
    type = 'button',
    onClick,
    children,
    className,
    'aria-label': ariaLabel,
  },
  ref,
) {
  const isDisabled = disabled || loading;
  const hasLabel = Boolean(children);

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading}
      aria-label={ariaLabel}
      onClick={onClick}
      className={cn(
        'font-body inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-sm)] font-semibold uppercase tracking-[0.08em] transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40',
        variantClasses[variant],
        sizeClasses[size],
        iconOnly && 'min-w-[30px] px-2',
        fullWidth && 'w-full',
        className,
      )}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : leftIcon}
      {hasLabel && <span>{children}</span>}
      {!loading && !hasLabel && !leftIcon && children}
      {!loading && rightIcon}
    </button>
  );
});
