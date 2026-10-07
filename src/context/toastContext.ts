import { createContext, useContext } from 'react';

export type ToastType = 'success' | 'error';

/** Sukses hilang setelah 3,5 detik, galat setelah 7 detik (docs/03 bagian Toast). */
export const TOAST_DURATION_MS: Record<ToastType, number> = {
  success: 3500,
  error: 7000,
};

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

export interface ToastContextValue {
  toasts: Toast[];
  showToast: (type: ToastType, message: string) => void;
  dismissToast: (id: number) => void;
}

export const ToastContext = createContext<ToastContextValue>({
  toasts: [],
  showToast: () => {},
  dismissToast: () => {},
});

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}
