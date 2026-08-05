import { X } from 'lucide-react';
import { cn } from '@/utils/helpers/cn';
import { Button } from '@/components/ui/Button';

interface ModalSectionProps {
  children: React.ReactNode;
  className?: string;
}

interface ModalTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface ModalDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalHeader({ children, className }: ModalSectionProps): React.ReactElement {
  return <div className={cn('mb-4 flex items-start justify-between gap-4', className)}>{children}</div>;
}

export function ModalCloseButton({ onClose }: { onClose: () => void }): React.ReactElement {
  return (
    <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
      <X className="h-4 w-4" />
    </Button>
  );
}

export function ModalTitle({ children, className }: ModalTitleProps): React.ReactElement {
  return (
    <h2 className={cn('font-display text-2xl font-light text-[var(--color-text-primary)]', className)}>
      {children}
    </h2>
  );
}

export function ModalDescription({ children, className }: ModalDescriptionProps): React.ReactElement {
  return <p className={cn('text-[var(--text-lg)] text-[var(--color-text-secondary)]', className)}>{children}</p>;
}

export function ModalBody({ children, className }: ModalSectionProps): React.ReactElement {
  return <div className={cn('flex-1 overflow-y-auto', className)}>{children}</div>;
}

export function ModalFooter({ children, className }: ModalSectionProps): React.ReactElement {
  return <div className={cn('mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end', className)}>{children}</div>;
}
