import { useTheme } from '@/hooks/useTheme';
import { otherTheme, type Theme } from '@/utils/theme';
import { Icon } from './Icon';
import styles from './ThemeToggle.module.scss';

const LABEL: Record<Theme, string> = {
  light: 'terang',
  dark: 'gelap',
};

/** Tombol ganti tema terang/gelap. Ikonnya menunjukkan tema tujuan: matahari untuk terang, bulan untuk gelap. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const target = otherTheme(theme);
  const label = `Ganti ke tema ${LABEL[target]}`;
  return (
    <button type="button" className={styles.button} onClick={() => setTheme(target)} aria-label={label} title={label}>
      <Icon name={target === 'light' ? 'matahari' : 'bulan'} size={20} />
    </button>
  );
}
