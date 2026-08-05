import { Loader2 } from 'lucide-react';

export function ChatThinkingBubble(): React.ReactElement {
  return (
    <div className="flex justify-start" role="status" aria-live="polite" aria-label="Assistant is thinking">
      <div
        className="flex max-w-[88%] items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--color-border-light)] bg-[var(--color-bg-secondary)] px-3 py-2.5"
      >
        <Loader2
          className="h-4 w-4 shrink-0 animate-spin text-[var(--color-text-muted)]"
          strokeWidth={2}
          aria-hidden="true"
        />
        <span className="text-[var(--text-sm)] text-[var(--color-text-muted)]">Assistant is thinking…</span>
      </div>
    </div>
  );
}
