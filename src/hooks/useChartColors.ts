import { useMemo, useSyncExternalStore } from 'react';
import { isDarkTheme, subscribeTheme } from '@/utils/theme';
import { readChartColors, type ChartColors } from '@/utils/chartColors';

/** Warna grafik dari variabel CSS; dibaca ulang saat tema berganti (manual maupun dari sistem). */
export function useChartColors(): ChartColors {
  const dark = useSyncExternalStore(subscribeTheme, isDarkTheme, () => false);
  // `dark` sengaja menjadi dependensi agar warna dibaca ulang setelah variabel CSS berganti.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => readChartColors(), [dark]);
}
