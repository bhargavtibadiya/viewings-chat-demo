import ReactMarkdown from 'react-markdown';
import { cn } from '@/utils/helpers/cn';

interface ChatMarkdownProps {
  content: string;
  inverted?: boolean;
}

/**
 * Converts underline tags into a safe marker link for the markdown renderer.
 *
 * @param content - Assistant message content to normalize
 * @returns Markdown content without raw underline HTML
 */
function prepareChatMarkdown(content: string): string {
  return content.replace(/<u>([\s\S]*?)<\/u>/gi, (_, inner: string) => {
    const safe = String(inner).replace(/\]/g, '\\]');
    return `[${safe}](#chat-underline)`;
  });
}

/**
 * Renders assistant message markdown using the chat visual treatment.
 *
 * @param props - Markdown content and its color context
 * @returns A sanitized, styled markdown message
 */
export function ChatMarkdown({ content, inverted = false }: ChatMarkdownProps): React.ReactElement {
  const prepared = prepareChatMarkdown(content);

  return (
    <div className={cn('chat-markdown', inverted && 'text-[var(--color-text-inverse)]')}>
      <ReactMarkdown
        components={{
          p: ({ children }) => (
            <p className={cn('mb-2 last:mb-0', inverted && 'text-[var(--color-text-inverse)]')}>{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="mb-2 mt-1 list-disc space-y-1.5 pl-5 last:mb-0 marker:text-[var(--color-primary)]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-2 mt-1 list-decimal space-y-1.5 pl-5 last:mb-0 marker:text-[var(--color-primary)]">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li
              className={cn(
                'leading-relaxed pl-0.5',
                inverted ? 'text-[var(--color-text-inverse)]' : 'text-[var(--color-text-primary)]',
              )}
            >
              {children}
            </li>
          ),
          strong: ({ children }) => (
            <strong
              className={cn(
                'font-semibold',
                inverted ? 'text-[var(--color-text-inverse)]' : 'text-[var(--color-primary)]',
              )}
            >
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em
              className={cn(
                'italic',
                inverted ? 'text-[var(--color-text-inverse)]/95' : 'text-[var(--color-text-secondary)]',
              )}
            >
              {children}
            </em>
          ),
          a: ({ href, children }) => {
            if (href === '#chat-underline') {
              return (
                <span
                  className={cn(
                    'font-medium underline decoration-2 underline-offset-[3px]',
                    inverted
                      ? 'decoration-[var(--color-text-inverse)] text-[var(--color-text-inverse)]'
                      : 'decoration-[var(--color-primary)] text-[var(--color-text-primary)]',
                  )}
                >
                  {children}
                </span>
              );
            }

            // [SEC] external links open in an isolated browsing context.
            return (
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
            );
          },
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
        {prepared}
      </ReactMarkdown>
    </div>
  );
}
