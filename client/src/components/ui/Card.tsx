import { cn } from '@/utils/helpers/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

export function Card({ children, className, padding = 'md' }: CardProps): React.ReactElement {
  const paddingClass =
    padding === 'sm' ? 'p-4' : padding === 'lg' ? 'p-8' : 'p-6';

  return (
    <div
      className={cn(
        'rounded-[var(--radius-sm)] border border-[var(--color-border-light)] bg-[var(--color-bg-surface)] shadow-[var(--shadow-card)]',
        paddingClass,
        className,
      )}
    >
      {children}
    </div>
  );
}
