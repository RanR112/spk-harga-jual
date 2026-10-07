import type { ReactNode } from 'react';
import styles from './ChartReading.module.scss';

/** Baris pembacaan angka di atas grafik: berisi tanggal dan nilai pada titik yang disentuh atau ditunjuk. */
export function ChartReading({ children }: { children: ReactNode }) {
  return <p className={styles.reading}>{children}</p>;
}
