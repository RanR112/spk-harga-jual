import { TEXT } from '@/constants/text';
import { Icon } from './Icon';
import styles from './ReloadButton.module.scss';

interface ReloadButtonProps {
  onClick: () => void;
  /** Saat `true`, ikon berputar dan tombol dinonaktifkan. */
  loading: boolean;
}

/** Tombol "Muat ulang" di header: ikon putar yang berputar selama data dimuat. */
export function ReloadButton({ onClick, loading }: ReloadButtonProps) {
  return (
    <button type="button" className={styles.button} onClick={onClick} disabled={loading} aria-busy={loading || undefined}>
      <Icon name="muat" size={18} className={loading ? styles.spinning : undefined} />
      {TEXT.reload}
    </button>
  );
}
