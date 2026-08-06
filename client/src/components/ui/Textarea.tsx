import { forwardRef } from 'react';
import { cn } from '@/utils/helpers/cn';
import { FieldErrorSlot } from '@/components/ui/FieldErrorSlot';

interface TextareaProps {
  label?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  id?: string;
  name?: string;
  className?: string;
}

/**
 * Renders a labeled textarea with consistent validation and accessibility wiring.
 *
 * @param props - Native-like textarea options and field messaging
 * @param ref - Reference forwarded to the textarea element
 * @returns A styled textarea field and optional message slot
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    label,
    helperText,
    error,
    disabled = false,
    readOnly = false,
    required = false,
    placeholder,
    value,
    defaultValue,
    onChange,
    rows = 4,
    id,
    name,
    className,
  },
  ref,
) {
  const textareaId = id ?? name;
  const describedBy = error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined;

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={textareaId} className="mb-1.5 block text-[var(--text-xs)] font-bold uppercase tracking-[0.1em] text-[var(--color-text-secondary)]">
          {label}
          {required && <span className="text-[var(--color-error)]"> *</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        name={name}
        rows={rows}
        disabled={disabled}
        readOnly={readOnly}
        required={required}
        placeholder={placeholder}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={cn(
          'min-h-20 w-full resize-y rounded-[var(--radius-sm)] border-[1.5px] border-[var(--color-border-medium)] bg-[var(--color-bg-surface)] px-3.5 py-2.5 text-[var(--text-md)] text-[var(--color-text-primary)] outline-none transition-[border-color,box-shadow] duration-200 focus:border-[var(--color-primary)] focus:shadow-[var(--shadow-input-focus)] disabled:cursor-not-allowed disabled:bg-[var(--color-bg-secondary)]',
          error && 'border-[var(--color-error)] bg-[var(--color-error-bg)]',
        )}
      />
      <FieldErrorSlot
        id={describedBy}
        message={error ?? helperText}
        isError={Boolean(error)}
      />
    </div>
  );
});
