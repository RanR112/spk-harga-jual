import { createContext, useContext } from 'react';

export interface RefreshContextValue {
  /** Bertambah setiap kali pengguna menekan "Muat ulang"; semua `useApi` ikut memuat ulang. */
  refreshCount: number;
  refreshAll: () => void;
}

export const RefreshContext = createContext<RefreshContextValue>({
  refreshCount: 0,
  refreshAll: () => {},
});

export function useRefresh(): RefreshContextValue {
  return useContext(RefreshContext);
}
