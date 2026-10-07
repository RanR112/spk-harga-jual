import { createContext, useContext } from 'react';
import type { DashboardData } from '@/api/types';
import type { ApiState } from '@/hooks/useApi';

/**
 * Data `getDashboard` dimuat sekali di tingkat aplikasi lalu dibagikan ke header
 * (tanggal data), halaman Dashboard, dan halaman Input harga (daftar bahan).
 */
export const DashboardContext = createContext<ApiState<DashboardData> | null>(null);

export function useDashboard(): ApiState<DashboardData> {
  const value = useContext(DashboardContext);
  if (!value) throw new Error('useDashboard harus dipakai di dalam DashboardProvider.');
  return value;
}
