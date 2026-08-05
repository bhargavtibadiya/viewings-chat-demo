import { forwardRef } from 'react';
import { cn } from '@/utils/helpers/cn';
import { FieldErrorSlot } from '@/components/ui/FieldErrorSlot';
import type { ComponentSize } from '@/components/ui/ui.types';

interface InputProps {
  type?: 'text' | 'number' | 'email' | 'search' | 'password' | 'tel' | 'url';
  size?: ComponentSize;
  label?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClear?: () => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  reserveErrorSpace?: boolean;
  id?: string;
  name?: string;
  autoFocus?: boolean;
  className?: string;
}

const sizeClasses: Record<ComponentSize, string> = {
  sm: 'min-h-8 px-3 py-2 text-[var(--text-sm)]',
  md: 'min-h-10 px-3.5 py-2.5 text-[var(--text-md)] max-sm:text-base',
  lg: 'min-h-12 px-4 py-3 text-[var(--text-md)] max-sm:text-base',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    type = 'text',
    size = 'md',
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
    leftIcon,
    rightIcon,
    reserveErrorSpace = false,
    id,
    name,
    autoFocus = false,
    className,
  },
  ref,
) {
  const inputId = id ?? name;
  const describedBy = error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined;

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-[var(--text-xs)] font-bold uppercase tracking-[0.1em] text-[var(--color-text-secondary)]">
          {label}
          {required && <span className="text-[var(--color-error)]"> *</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          name={name}
          type={type}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          placeholder={placeholder}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          autoFocus={autoFocus}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cn(
            'w-full rounded-[var(--radius-sm)] border-[1.5px] border-[var(--color-border-medium)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:shadow-[var(--shadow-input-focus)] disabled:cursor-not-allowed disabled:bg-[var(--color-bg-secondary)] disabled:opacity-50',
            sizeClasses[size],
            leftIcon ? 'pl-10' : undefined,
            rightIcon ? 'pr-10' : undefined,
            error && 'border-[var(--color-error)] bg-[var(--color-error-bg)]',
          )}
        />
        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
            {rightIcon}
          </span>
        )}
      </div>
      <FieldErrorSlot
        id={describedBy}
        message={error ?? helperText}
        isError={Boolean(error)}
        reserveSpace={reserveErrorSpace}
      />
    </div>
  );
});
