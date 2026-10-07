import type { ReactNode } from 'react';
import { StatusMessage } from './StatusMessage';

interface AsyncContentProps<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  onRetry: () => void;
  /** Kapan data dianggap kosong. Bawaan: array tanpa isi. */
  isEmpty?: (data: T) => boolean;
  emptyMessage: string;
  loadingMessage?: string;
  children: (data: T) => ReactNode;
}

function defaultIsEmpty(data: unknown): boolean {
  return Array.isArray(data) && data.length === 0;
}

/** Memilih tampilan galat, memuat, kosong, atau isi untuk satu pemanggilan API. */
export function AsyncContent<T>({
  data,
  error,
  loading,
  onRetry,
  isEmpty = defaultIsEmpty,
  emptyMessage,
  loadingMessage,
  children,
}: AsyncContentProps<T>) {
  if (error) {
    return (
      <StatusMessage variant="error" onRetry={onRetry}>
        {error}
      </StatusMessage>
    );
  }
  if (data === null) {
    return loading ? <StatusMessage variant="loading">{loadingMessage}</StatusMessage> : null;
  }
  if (isEmpty(data)) return <StatusMessage variant="empty">{emptyMessage}</StatusMessage>;
  return <>{children(data)}</>;
}
