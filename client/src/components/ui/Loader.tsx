import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/helpers/cn';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export function Loader({ size = 'md', label = 'Loading', className }: LoaderProps): React.ReactElement {
  return (
    <div className={cn('inline-flex items-center gap-2 text-[var(--color-text-muted)]', className)} role="status">
      <Loader2 className={cn('animate-spin', sizeMap[size])} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
