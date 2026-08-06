import { cn } from '@/utils/helpers/cn';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
}

/**
 * Renders a labeled native select control from application options.
 *
 * @param props - Select options, state, and accessibility metadata
 * @returns A styled select field
 */
export function Select({
  options,
  value,
  onChange,
  label,
  placeholder = 'Select an option',
  error,
  disabled = false,
  id,
  name,
  className,
}: SelectProps): React.ReactElement {
  const selectId = id ?? name;

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-[var(--text-xs)] font-bold uppercase tracking-[0.1em] text-[var(--color-text-secondary)]">
          {label}
        </label>
      )}
      <select
        id={selectId}
        name={name}
        disabled={disabled}
        value={value ?? ''}
        onChange={(event) => onChange?.(event.target.value)}
        aria-invalid={Boolean(error)}
        className={cn(
          'min-h-10 w-full rounded-[var(--radius-sm)] border-[1.5px] border-[var(--color-border-medium)] bg-[var(--color-bg-surface)] px-3.5 py-2.5 text-[var(--text-md)] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)] focus:shadow-[var(--shadow-input-focus)] disabled:cursor-not-allowed disabled:bg-[var(--color-bg-secondary)]',
          error && 'border-[var(--color-error)] bg-[var(--color-error-bg)]',
        )}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-[var(--text-sm)] text-[var(--color-error)]">{error}</p>}
    </div>
  );
}

export type { SelectOption };
