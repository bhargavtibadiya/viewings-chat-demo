import { Badge } from '@/components/ui';
import type { IChatMessage } from '@/store/types';
import { cn } from '@/utils/helpers/cn';

interface ChatThreadProps {
  messages: IChatMessage[];
  sendLoading: boolean;
}

export function ChatThread({ messages, sendLoading }: ChatThreadProps): React.ReactElement {
  return (
    <div className="space-y-3">
      {messages.length === 0 && (
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
      {sendLoading && (
        <div className="rounded-[var(--radius-sm)] border border-[var(--color-border-light)] bg-[var(--color-bg-base)] px-3 py-2 text-[var(--text-sm)] text-[var(--color-text-muted)]">
          Assistant is thinking…
        </div>
      )}
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
        <p className={cn('whitespace-pre-wrap', isUser && 'text-[var(--color-text-inverse)]')}>
          {message.content}
        </p>
        {!isUser && message.answerStatus && (
          <div className="mt-2">
            <Badge
              variant="solid"
              status={
                message.answerStatus === 'VERIFIED'
                  ? 'success'
                  : message.answerStatus === 'LIMITED'
                    ? 'warning'
                    : 'neutral'
              }
              size="sm"
            >
              {message.answerStatus}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}
