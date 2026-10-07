import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { TOAST_DURATION_MS, ToastContext, type Toast, type ToastType } from './toastContext';

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismissToast = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setToasts((list) => list.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string) => {
      const id = nextId.current++;
      setToasts((list) => [...list, { id, type, message }]);
      timers.current.set(id, setTimeout(() => dismissToast(id), TOAST_DURATION_MS[type]));
    },
    [dismissToast],
  );

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => clearTimeout(timer));
  }, []);

  const value = useMemo(() => ({ toasts, showToast, dismissToast }), [toasts, showToast, dismissToast]);
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}
