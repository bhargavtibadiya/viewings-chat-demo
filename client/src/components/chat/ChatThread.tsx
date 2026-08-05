import { useCallback, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { ChatMarkdown } from '@/components/chat/ChatMarkdown';
import { ChatThinkingBubble } from '@/components/chat/ChatThinkingBubble';
import type { IChatMessage } from '@/store/types';
import { cn } from '@/utils/helpers/cn';

interface ChatThreadProps {
  messages: IChatMessage[];
  isThinking: boolean;
  hasMoreOlder: boolean;
  loadingOlder: boolean;
  onLoadOlder: () => void;
}

const SCROLL_TOP_THRESHOLD_PX = 80;

export function ChatThread({
  messages,
  isThinking,
  hasMoreOlder,
  loadingOlder,
  onLoadOlder,
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
      container.scrollTop = container.scrollHeight - prevScrollHeightRef.current;
      isPrependingRef.current = false;
      return;
    }

    if (shouldStickToBottomRef.current) {
      scrollToBottom('auto');
    }
  }, [loadingOlder, messages, isThinking, scrollToBottom]);

  const handleScroll = (): void => {
    const container = scrollRef.current;
    if (!container) return;

    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    shouldStickToBottomRef.current = distanceFromBottom < 120;

    if (!loadingOlder && hasMoreOlder && container.scrollTop < SCROLL_TOP_THRESHOLD_PX) {
      onLoadOlder();
    }
  };

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
          <MessageBubble key={message.id} message={message} />
        ))}
        {isThinking && <ChatThinkingBubble />}
      </div>
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  );
}

interface MessageBubbleProps {
  message: IChatMessage;
}

function MessageBubble({ message }: MessageBubbleProps): React.ReactElement {
  const isUser = message.role === 'USER';

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[88%] rounded-[var(--radius-sm)] px-3 py-2 text-[var(--text-sm)] leading-relaxed',
          isUser
            ? 'bg-[var(--color-primary)] text-[var(--color-text-inverse)] [&_p]:text-[var(--color-text-inverse)]'
            : 'border border-[var(--color-border-light)] bg-[var(--color-bg-base)] text-[var(--color-text-primary)]',
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap text-[var(--color-text-inverse)]">{message.content}</p>
        ) : (
          <ChatMarkdown content={message.content} />
        )}
      </div>
    </div>
  );
}
