import { TEXT } from '@/constants/text';
import styles from './DemoBanner.module.scss';

export function DemoBanner() {
  return (
    <div className={styles.banner} role="note">
      <strong>{TEXT.demoBanner}</strong> {TEXT.demoBannerDetail}
    </div>
  );
}
