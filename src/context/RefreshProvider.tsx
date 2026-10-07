import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { RefreshContext } from './refreshContext';

export function RefreshProvider({ children }: { children: ReactNode }) {
  const [refreshCount, setRefreshCount] = useState(0);
  const refreshAll = useCallback(() => setRefreshCount((count) => count + 1), []);
  const value = useMemo(() => ({ refreshCount, refreshAll }), [refreshCount, refreshAll]);
  return <RefreshContext.Provider value={value}>{children}</RefreshContext.Provider>;
}
