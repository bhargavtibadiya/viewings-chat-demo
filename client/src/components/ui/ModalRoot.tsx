import { useEffect, useRef } from 'react';
import { cn } from '@/utils/helpers/cn';

interface ModalRootProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  size?: 'sm' | 'md' | 'lg' | 'full';
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  children: React.ReactNode;
  className?: string;
}

const sizeClasses = {
  sm: 'max-w-[420px]',
  md: 'max-w-[480px]',
  lg: 'max-w-[640px]',
  full: 'max-w-[95vw]',
};

export function ModalRoot({
  open,
  onOpenChange,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
  children,
  className,
}: ModalRootProps): React.ReactElement | null {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (closeOnEscape && event.key === 'Escape') {
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeOnEscape, onOpenChange, open]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close modal backdrop"
        className="absolute inset-0 bg-[var(--color-bg-overlay)] backdrop-blur-sm"
        onClick={() => {
          if (closeOnBackdrop) {
            onOpenChange(false);
          }
        }}
      />
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative z-[calc(var(--z-modal)+1)] flex max-h-[95vh] w-full flex-col overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-bg-base)] p-5 shadow-[var(--shadow-modal)] sm:p-8',
          sizeClasses[size],
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
