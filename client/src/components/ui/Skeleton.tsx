import { cn } from '@/utils/helpers/cn';

interface SkeletonProps {
  variant?: 'text' | 'heading' | 'avatar' | 'button' | 'input' | 'card' | 'custom';
  width?: string | number;
  height?: string | number;
  lines?: number;
  className?: string;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  lines = 1,
  className,
}: SkeletonProps): React.ReactElement {
  if (variant === 'card') {
    return (
      <div
        aria-busy="true"
        aria-label="Loading"
        className={cn(
          'space-y-3 rounded-[var(--radius-sm)] border border-[var(--color-border-light)] bg-[var(--color-bg-surface)] p-6',
          className,
        )}
      >
        <div className="h-6 w-1/3 animate-pulse rounded-[var(--radius-sm)] bg-[var(--color-bg-secondary)]" />
        <div className="h-4 w-full animate-pulse rounded-[var(--radius-sm)] bg-[var(--color-bg-secondary)]" />
        <div className="h-4 w-2/3 animate-pulse rounded-[var(--radius-sm)] bg-[var(--color-bg-secondary)]" />
      </div>
    );
  }

  if (lines > 1) {
    return (
      <div aria-busy="true" aria-label="Loading" className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={`skeleton-line-${index}`}
            className="h-4 animate-pulse rounded-[var(--radius-sm)] bg-[var(--color-bg-secondary)]"
            style={{ width: index === lines - 1 ? '70%' : '100%' }}
          />
        ))}
      </div>
    );
  }

  const defaultHeight =
    variant === 'heading' ? '1.5rem' : variant === 'avatar' ? '2.5rem' : variant === 'button' ? '2.5rem' : '1rem';

  return (
    <div
      aria-busy="true"
      aria-label="Loading"
      className={cn(
        'animate-pulse rounded-[var(--radius-sm)] bg-[var(--color-bg-secondary)]',
        variant === 'avatar' && 'rounded-full',
        className,
      )}
      style={{
        width: width ?? (variant === 'avatar' ? '2.5rem' : '100%'),
        height: height ?? defaultHeight,
      }}
    />
  );
}
