import { cn } from '@/utils/helpers/cn';

interface FieldErrorSlotProps {
  id?: string;
  message?: string;
  isError?: boolean;
  reserveSpace?: boolean;
}

export function FieldErrorSlot({
  id,
  message,
  isError = false,
  reserveSpace = false,
}: FieldErrorSlotProps): React.ReactElement {
  const shouldRender = Boolean(message) || reserveSpace;

  if (!shouldRender) {
    return <span className="sr-only" />;
  }

  return (
    <p
      id={id}
      className={cn(
        'mt-1 h-5 overflow-hidden truncate text-[var(--text-sm)]',
        isError ? 'text-[var(--color-error)]' : 'text-[var(--color-text-tertiary)]',
        reserveSpace && !message && 'invisible',
      )}
    >
      {message ?? '\u00a0'}
    </p>
  );
}
