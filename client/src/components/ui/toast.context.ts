import { createContext } from 'react';
import type { SemanticStatus } from '@/components/ui/ui.types';

interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: SemanticStatus | 'default';
  duration?: number;
  action?: ToastAction;
}

export interface ToastContextValue {
  show: (toast: Omit<ToastItem, 'id'>) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
