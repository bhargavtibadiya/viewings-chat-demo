import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/utils/helpers/cn';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

interface CommandMenuItem {
  id: string;
  label: string;
  description?: string;
  meta?: string;
  onSelect: () => void;
}

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandMenuItem[];
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
}

/**
 * Displays a keyboard-navigable command palette for filtering listings.
 *
 * @param props - Visibility, searchable items, and close handler
 * @returns The command palette, or nothing while closed
 */
export function CommandMenu({
  open,
  onOpenChange,
  items,
  placeholder = 'Search listings...',
  emptyMessage = 'No results found',
  className,
}: CommandMenuProps): React.ReactElement | null {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (normalized.length === 0) {
      return items;
    }
    return items.filter((item) => {
      const haystack = `${item.label} ${item.description ?? ''} ${item.meta ?? ''}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [items, query]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setActiveIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
      if (event.key === 'ArrowDown') {
        // [WHY] prevent page scrolling while arrow keys move the active command.
        event.preventDefault();
        setActiveIndex((current) => Math.min(current + 1, Math.max(filteredItems.length - 1, 0)));
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex((current) => Math.max(current - 1, 0));
      }
      if (event.key === 'Enter' && filteredItems[activeIndex]) {
        event.preventDefault();
        filteredItems[activeIndex].onSelect();
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, filteredItems, onOpenChange, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-start justify-center p-4 pt-[12vh]" role="presentation">
      <button
        type="button"
        aria-label="Close command menu"
        className="absolute inset-0 bg-[var(--color-bg-overlay)] backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search listings"
        className={cn(
          'relative z-[calc(var(--z-modal)+1)] w-full max-w-2xl overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-border-light)] bg-[var(--color-bg-surface)] shadow-[var(--shadow-modal)]',
          className,
        )}
      >
        <div className="border-b border-[var(--color-border-light)] p-4">
          <Input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            leftIcon={<Search className="h-4 w-4" />}
            autoFocus
          />
        </div>
        <ul className="max-h-[50vh] overflow-y-auto p-2">
          {filteredItems.length === 0 && (
            <li className="px-4 py-6 text-center text-[var(--text-sm)] text-[var(--color-text-muted)]">
              {emptyMessage}
            </li>
          )}
          {filteredItems.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                className={cn(
                  'flex w-full items-start justify-between gap-3 rounded-[var(--radius-sm)] px-4 py-3 text-left transition-colors',
                  index === activeIndex
                    ? 'bg-[var(--color-bg-secondary)]'
                    : 'hover:bg-[var(--color-bg-secondary)]',
                )}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => {
                  item.onSelect();
                  onOpenChange(false);
                }}
              >
                <span>
                  <span className="block font-display text-lg text-[var(--color-text-primary)]">
                    {item.label}
                  </span>
                  {item.description && (
                    <span className="mt-1 block text-[var(--text-sm)] text-[var(--color-text-secondary)]">
                      {item.description}
                    </span>
                  )}
                </span>
                {item.meta && (
                  <Badge variant="ghost" status="neutral" size="sm">
                    {item.meta}
                  </Badge>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
