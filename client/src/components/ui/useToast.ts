import { useContext } from 'react';
import { ToastContext, type ToastContextValue } from '@/components/ui/toast.context';

/**
 * Retrieves the notification API from the nearest toast provider.
 *
 * @returns The toast display function
 * @throws {Error} If no toast provider is mounted above the caller
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (context === null) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
