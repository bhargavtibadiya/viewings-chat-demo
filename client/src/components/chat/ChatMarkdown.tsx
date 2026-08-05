import ReactMarkdown from 'react-markdown';
import { cn } from '@/utils/helpers/cn';

interface ChatMarkdownProps {
  content: string;
  inverted?: boolean;
}

export function ChatMarkdown({ content, inverted = false }: ChatMarkdownProps): React.ReactElement {
  return (
    <div className={cn('chat-markdown', inverted && 'text-[var(--color-text-inverse)]')}>
      <ReactMarkdown
        components={{
        p: ({ children }) => (
          <p className={cn('mb-2 last:mb-0', inverted && 'text-[var(--color-text-inverse)]')}>{children}</p>
        ),
        ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-4 last:mb-0">{children}</ul>,
        ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-4 last:mb-0">{children}</ol>,
        li: ({ children }) => (
          <li className={cn(inverted && 'text-[var(--color-text-inverse)]')}>{children}</li>
        ),
        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        em: ({ children }) => <em>{children}</em>,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'underline underline-offset-2',
              inverted ? 'text-[var(--color-text-inverse)]' : 'text-[var(--color-primary)]',
            )}
          >
            {children}
          </a>
        ),
        code: ({ children }) => (
          <code
            className={cn(
              'rounded px-1 py-0.5 text-[var(--text-xs)]',
              inverted ? 'bg-white/15' : 'bg-[var(--color-bg-secondary)]',
            )}
          >
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre
            className={cn(
              'mb-2 overflow-x-auto rounded-[var(--radius-sm)] p-2 text-[var(--text-xs)] last:mb-0',
              inverted ? 'bg-white/15' : 'bg-[var(--color-bg-secondary)]',
            )}
          >
            {children}
          </pre>
        ),
        h1: ({ children }) => <p className="mb-2 font-semibold last:mb-0">{children}</p>,
        h2: ({ children }) => <p className="mb-2 font-semibold last:mb-0">{children}</p>,
        h3: ({ children }) => <p className="mb-2 font-semibold last:mb-0">{children}</p>,
        blockquote: ({ children }) => (
          <blockquote className="mb-2 border-l-2 border-[var(--color-border-medium)] pl-3 last:mb-0">
            {children}
          </blockquote>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
    </div>
  );
}
