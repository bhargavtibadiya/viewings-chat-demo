import { Skeleton } from '@/components/ui';

/**
 * Renders an accessible assistant-response loading indicator.
 *
 * @returns The assistant thinking placeholder
 */
export function ChatThinkingBubble(): React.ReactElement {
  return (
    <div className="flex justify-start" role="status" aria-live="polite" aria-label="Assistant is thinking">
      <div
        className="flex w-[min(88%,18rem)] flex-col gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border-light)] bg-[var(--color-bg-base)] px-3 py-2.5"
      >
        <Skeleton variant="custom" width="92%" height="0.7rem" className="rounded-full" />
        <Skeleton variant="custom" width="78%" height="0.7rem" className="rounded-full" />
        <Skeleton variant="custom" width="54%" height="0.7rem" className="rounded-full" />
      </div>
    </div>
  );
}
