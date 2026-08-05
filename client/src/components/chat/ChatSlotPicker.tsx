import { CalendarDays, CalendarClock, Loader2 } from 'lucide-react';
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

interface SlotDisplay {
  date: string;
  time: string;
}

function getPayloadString(action: IChatAction, key: string): string | null {
  const value = action.payload?.[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function formatSlot(action: IChatAction): SlotDisplay {
  const startsAtValue = getPayloadString(action, 'startsAt');
  const endsAtValue = getPayloadString(action, 'endsAt');

  if (!startsAtValue) {
    return { date: action.label, time: '' };
  }

  const startsAt = new Date(startsAtValue);
  const endsAt = endsAtValue ? new Date(endsAtValue) : null;
  if (Number.isNaN(startsAt.getTime())) {
    return { date: action.label, time: '' };
  }

  const date = new Intl.DateTimeFormat('en-NZ', {
    timeZone: 'Pacific/Auckland',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(startsAt);
  const timeFormatter = new Intl.DateTimeFormat('en-NZ', {
    timeZone: 'Pacific/Auckland',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const startTime = timeFormatter.format(startsAt);
  const endTime =
    endsAt && !Number.isNaN(endsAt.getTime()) ? timeFormatter.format(endsAt) : null;

  return {
    date,
    time: endTime ? `${startTime} – ${endTime}` : startTime,
  };
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
    <div className="mt-4 border-t border-[var(--color-border-light)] pt-4">
      <div className="mb-3 flex items-center gap-2 text-[var(--text-xs)] font-bold uppercase tracking-[0.1em] text-[var(--color-text-primary)]">
        <CalendarClock className="h-4 w-4 text-[var(--color-primary)]" strokeWidth={1.7} aria-hidden="true" />
        <span>Select a viewing time</span>
      </div>
      <div className="grid grid-cols-1 gap-2.5 min-[560px]:grid-cols-2">
        {slots.map((action) => {
          const slotId = getSlotId(action);
          if (!slotId) return null;

          const isBooking = bookingSlotId === slotId;
          const isBusy = disabled || Boolean(bookingSlotId);
          const display = formatSlot(action);

          return (
            <div
              key={`${slotId}-${action.label}`}
              className={cn(
                'rounded-[6px] border border-[var(--color-border-light)] bg-[var(--color-bg-surface)] p-2.5 shadow-[var(--shadow-card)] transition-[border-color,box-shadow]',
                isBooking && 'border-[var(--color-primary)] shadow-[var(--shadow-sm)]',
              )}
            >
              <div className="flex min-h-[56px] items-center gap-3 px-1 pb-2.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-[var(--color-bg-secondary)] text-[var(--color-primary)]">
                  <CalendarDays className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-[var(--text-md)] font-semibold leading-snug text-[var(--color-text-primary)]">
                    {display.date}
                  </p>
                  {display.time && (
                    <p className="mt-0.5 text-[var(--text-sm)] leading-snug text-[var(--color-text-secondary)]">
                      {display.time}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                disabled={isBusy}
                onClick={() => onBookSlot(slotId, action.label)}
                className={cn(
                  'flex min-h-[38px] w-full items-center justify-center gap-2 rounded-[4px] border border-[var(--color-border-light)]',
                  'bg-[var(--color-bg-secondary)] px-3 py-2 text-[var(--text-xs)] font-bold uppercase tracking-[0.1em] text-[var(--color-text-primary)]',
                  'transition-[background-color,border-color,color,transform] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-[var(--color-text-inverse)]',
                  'active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1',
                  'disabled:cursor-not-allowed disabled:opacity-60',
                  isBooking && 'border-[var(--color-primary)] bg-[var(--color-primary-light)] text-[var(--color-primary)]',
                )}
                aria-label={`Book viewing for ${display.date}${display.time ? `, ${display.time}` : ''}`}
              >
                {isBooking && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
                <span>{isBooking ? 'Booking…' : 'Book'}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
