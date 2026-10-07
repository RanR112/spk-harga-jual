import type { ReactNode } from 'react';
import { api } from '@/api/endpoints';
import { useApi } from '@/hooks/useApi';
import { DashboardContext } from './dashboardContext';

export function DashboardProvider({ children }: { children: ReactNode }) {
  const state = useApi(api.getDashboard);
  return <DashboardContext.Provider value={state}>{children}</DashboardContext.Provider>;
}
