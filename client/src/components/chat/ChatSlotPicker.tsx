import { CalendarClock, Loader2 } from 'lucide-react';
import { cn } from '@/utils/helpers/cn';
import type { IChatAction } from '@/store/types';

interface ChatSlotPickerProps {
  actions: IChatAction[];
  disabled?: boolean;
  bookingSlotId?: string | null;
  onBookSlot: (slotId: string, label: string) => void;
}

function getSlotId(action: IChatAction): string | null {
  const slotId = action.payload?.slotId;
  return typeof slotId === 'string' && slotId.length > 0 ? slotId : null;
}

export function ChatSlotPicker({
  actions,
  disabled = false,
  bookingSlotId = null,
  onBookSlot,
}: ChatSlotPickerProps): React.ReactElement | null {
  const slots = actions.filter((action) => action.type === 'book_slot' && getSlotId(action));

  if (slots.length === 0) {
    return null;
  }

  return (
    <div className="mt-2.5 border-t border-[var(--color-border-light)] pt-2.5">
      <div className="mb-2 flex items-center gap-1.5 text-[var(--text-2xs)] font-bold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
        <CalendarClock className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
        <span>Select a viewing time</span>
      </div>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {slots.map((action) => {
          const slotId = getSlotId(action);
          if (!slotId) return null;

          const isBooking = bookingSlotId === slotId;
          const isBusy = disabled || Boolean(bookingSlotId);

          return (
            <button
              key={`${slotId}-${action.label}`}
              type="button"
              disabled={isBusy}
              onClick={() => onBookSlot(slotId, action.label)}
              className={cn(
                'group flex min-h-[40px] items-center justify-between gap-2 rounded-[var(--radius-sm)] border px-3 py-2 text-left transition-colors',
                'border-[var(--color-border-medium)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)]',
                'hover:border-[var(--color-primary)] hover:bg-[var(--color-btn-secondary-hover)]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1',
                'disabled:cursor-not-allowed disabled:opacity-60',
                isBooking && 'border-[var(--color-primary)] bg-[var(--color-btn-secondary-hover)]',
              )}
            >
              <span className="text-[var(--text-sm)] leading-snug font-medium">{action.label}</span>
              {isBooking ? (
                <Loader2
                  className="h-3.5 w-3.5 shrink-0 animate-spin text-[var(--color-primary)]"
                  aria-hidden="true"
                />
              ) : (
                <span className="shrink-0 text-[var(--text-2xs)] font-bold uppercase tracking-[0.06em] text-[var(--color-primary)] opacity-80 group-hover:opacity-100">
                  Book
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
