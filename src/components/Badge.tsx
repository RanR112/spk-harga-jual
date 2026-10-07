import type { Keputusan } from '@/api/types';
import { KEPUTUSAN_LABEL } from '@/constants/text';
import { KeputusanIcon } from './KeputusanIcon';
import styles from './Badge.module.scss';

interface BadgeProps {
  keputusan: Keputusan;
  /** Ukuran besar, untuk judul dialog. */
  large?: boolean;
}

/**
 * Cap keputusan. Berisi ikon bentuk, kata pendek, dan garis tepi yang berbeda per keputusan,
 * jadi warna bukan satu-satunya penanda. Nama lengkap ada di teks khusus pembaca layar.
 */
export function Badge({ keputusan, large = false }: BadgeProps) {
  const style = KEPUTUSAN_LABEL[keputusan] ?? KEPUTUSAN_LABEL['DATA TIDAK LENGKAP'];
  const classes = [styles.cap, styles[style.key], large ? styles.large : ''].filter(Boolean).join(' ');
  return (
    <span className={classes}>
      <KeputusanIcon name={style.key} />
      {style.cap}
      <span className="visually-hidden"> ({style.label})</span>
    </span>
  );
}
