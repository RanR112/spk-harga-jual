import { useSyncExternalStore } from 'react';
import { getTheme, setTheme, subscribeTheme, type Theme } from '@/utils/theme';

export function useTheme(): { theme: Theme; setTheme: (value: Theme) => void } {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, () => 'light' as const);
  return { theme, setTheme };
}
