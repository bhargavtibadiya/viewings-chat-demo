import { useCallback, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { ChatMarkdown } from '@/components/chat/ChatMarkdown';
import { ChatSlotPicker } from '@/components/chat/ChatSlotPicker';
import { ChatThinkingBubble } from '@/components/chat/ChatThinkingBubble';
import type { IChatMessage } from '@/store/types';
import { cn } from '@/utils/helpers/cn';

interface ChatThreadProps {
  messages: IChatMessage[];
  isThinking: boolean;
  hasMoreOlder: boolean;
  loadingOlder: boolean;
  onLoadOlder: () => void;
  bookingSlotId?: string | null;
  onBookSlot?: (slotId: string, label: string) => void;
}

const SCROLL_TOP_THRESHOLD_PX = 80;

/**
 * Renders a paginated chat transcript while preserving the reader's scroll position.
 *
 * @param props - Messages, loading state, and pagination and booking callbacks
 * @returns The scrollable chat transcript
 */
export function ChatThread({
  messages,
  isThinking,
  hasMoreOlder,
  loadingOlder,
  onLoadOlder,
  bookingSlotId = null,
  onBookSlot,
}: ChatThreadProps): React.ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef(0);
  const isPrependingRef = useRef(false);
  const shouldStickToBottomRef = useRef(true);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto'): void => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior });
  }, []);

  useEffect(() => {
    if (loadingOlder) {
      isPrependingRef.current = true;
      const container = scrollRef.current;
      if (container) {
        prevScrollHeightRef.current = container.scrollHeight;
      }
      return;
    }

    const container = scrollRef.current;
    if (!container) return;

    if (isPrependingRef.current) {
      // [WHY] restore the prior viewport after older messages increase scroll height above it.
      container.scrollTop = container.scrollHeight - prevScrollHeightRef.current;
      isPrependingRef.current = false;
      return;
    }

    if (shouldStickToBottomRef.current) {
      scrollToBottom('auto');
    }
  }, [loadingOlder, messages, isThinking, bookingSlotId, scrollToBottom]);

  const handleScroll = (): void => {
    const container = scrollRef.current;
    if (!container) return;

    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    // [WHY] preserve reading position unless the user is already near the latest message.
    shouldStickToBottomRef.current = distanceFromBottom < 120;

    if (!loadingOlder && hasMoreOlder && container.scrollTop < SCROLL_TOP_THRESHOLD_PX) {
      onLoadOlder();
    }
  };

  const latestSlotMessageId = [...messages]
    .reverse()
    .find((message) => message.role === 'ASSISTANT' && message.actions?.some((action) => action.type === 'book_slot'))
    ?.id;

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="min-h-0 flex-1 overflow-y-auto px-3 py-3"
    >
      {loadingOlder && (
        <div className="mb-3 flex justify-center">
          <div className="inline-flex items-center gap-2 text-[var(--text-xs)] text-[var(--color-text-muted)]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            <span>Loading earlier messages…</span>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {messages.length === 0 && !isThinking && (
          <div className="rounded-[var(--radius-sm)] border border-dashed border-[var(--color-border-light)] bg-[var(--color-bg-base)] px-4 py-5 text-center">
            <p className="font-display text-lg text-[var(--color-text-primary)]">
              Ask about this property
            </p>
            <p className="mt-1 text-[var(--text-sm)] text-[var(--color-text-secondary)]">
              Furnishing, pets, accessibility, or book a viewing.
            </p>
          </div>
        )}
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            showSlotPicker={message.id === latestSlotMessageId}
            bookingSlotId={bookingSlotId}
            onBookSlot={onBookSlot}
            slotsDisabled={isThinking || Boolean(bookingSlotId)}
          />
        ))}
        {isThinking && <ChatThinkingBubble />}
      </div>
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  );
}

interface MessageBubbleProps {
  message: IChatMessage;
  showSlotPicker: boolean;
  bookingSlotId?: string | null;
  onBookSlot?: (slotId: string, label: string) => void;
  slotsDisabled: boolean;
}

function MessageBubble({
  message,
  showSlotPicker,
  bookingSlotId,
  onBookSlot,
  slotsDisabled,
}: MessageBubbleProps): React.ReactElement {
  const isUser = message.role === 'USER';
  const hasSlots =
    showSlotPicker &&
    Boolean(onBookSlot) &&
    Boolean(message.actions?.some((action) => action.type === 'book_slot'));

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'rounded-[var(--radius-sm)] text-[var(--text-sm)] leading-relaxed',
          isUser
            ? 'max-w-[88%] bg-[var(--color-primary)] px-3 py-2 text-[var(--color-text-inverse)] [&_p]:text-[var(--color-text-inverse)]'
            : hasSlots
              ? 'w-full max-w-[42rem] border border-[var(--color-border-light)] bg-[var(--color-bg-base)] px-3 py-3 text-[var(--color-text-primary)] sm:px-4 sm:py-4'
              : 'max-w-[88%] border border-[var(--color-border-light)] bg-[var(--color-bg-base)] px-3 py-2 text-[var(--color-text-primary)]',
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-[var(--color-text-inverse)]">{message.content}</p>
        ) : (
          <>
            <ChatMarkdown content={message.content} />
            {hasSlots && message.actions && onBookSlot && (
              <ChatSlotPicker
                actions={message.actions}
                disabled={slotsDisabled}
                bookingSlotId={bookingSlotId}
                onBookSlot={onBookSlot}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
