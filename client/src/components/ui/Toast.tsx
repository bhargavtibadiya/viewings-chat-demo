import { useCallback, useMemo, useState } from 'react';
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from 'lucide-react';
import { cn } from '@/utils/helpers/cn';
import { ToastContext, type ToastItem } from '@/components/ui/toast.context';

interface ToastProviderProps {
  children: React.ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const positionClasses = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
};

const variantBorder: Record<NonNullable<ToastItem['variant']>, string> = {
  success: 'border-l-[var(--color-success)]',
  warning: 'border-l-[var(--color-warning)]',
  error: 'border-l-[var(--color-error)]',
  info: 'border-l-[var(--color-info)]',
  neutral: 'border-l-[var(--color-border-medium)]',
  default: 'border-l-[var(--color-border-medium)]',
};

const variantIcon: Record<NonNullable<ToastItem['variant']>, React.ReactElement> = {
  success: <CheckCircle2 className="h-4 w-4 text-[var(--color-success)]" />,
  warning: <TriangleAlert className="h-4 w-4 text-[var(--color-warning)]" />,
  error: <XCircle className="h-4 w-4 text-[var(--color-error)]" />,
  info: <Info className="h-4 w-4 text-[var(--color-info)]" />,
  neutral: <Info className="h-4 w-4 text-[var(--color-text-muted)]" />,
  default: <Info className="h-4 w-4 text-[var(--color-text-muted)]" />,
};

export function ToastProvider({
  children,
  position = 'top-right',
}: ToastProviderProps): React.ReactElement {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      const nextToast: ToastItem = { ...toast, id };
      setToasts((current) => [...current, nextToast]);

      const duration = toast.duration ?? 5000;
      window.setTimeout(() => removeToast(id), duration);
    },
    [removeToast],
  );

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className={cn('fixed z-[var(--z-toast)] flex w-[min(100vw-2rem,360px)] flex-col gap-3', positionClasses[position])}
      >
        {toasts.map((toast) => {
          const variant = toast.variant ?? 'default';
          return (
            <div
              key={toast.id}
              className={cn(
                'rounded-[var(--radius-sm)] border border-[var(--color-border-light)] border-l-[3px] bg-[var(--color-bg-surface)] p-4 shadow-[var(--shadow-md)]',
                variantBorder[variant],
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {variantIcon[variant]}
                    <p className="text-[var(--text-md)] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-primary)]">
                      {toast.title}
                    </p>
                  </div>
                  {toast.description && (
                    <p className="mt-1 text-[var(--text-sm)] text-[var(--color-text-secondary)]">{toast.description}</p>
                  )}
                  {toast.action && (
                    <button
                      type="button"
                      className="mt-2 text-[var(--text-sm)] font-semibold uppercase tracking-[0.08em] text-[var(--color-primary)]"
                      onClick={toast.action.onClick}
                    >
                      {toast.action.label}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="Dismiss notification"
                  className="text-[var(--color-text-muted)]"
                  onClick={() => removeToast(toast.id)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
