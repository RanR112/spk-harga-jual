import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { KEPUTUSAN_LABEL, KEPUTUSAN_ORDER, TEXT } from '@/constants/text';
import styles from './CapLegend.module.scss';

/** Penjelasan singkat arti tiap cap keputusan, untuk pemilik usaha yang belum akrab dengan istilahnya. */
export function CapLegend() {
  return (
    <Card title={TEXT.legendTitle}>
      <p className={styles.intro}>{TEXT.legendIntro}</p>
      <ul className={styles.list}>
        {KEPUTUSAN_ORDER.map((keputusan) => (
          <li key={keputusan}>
            <span className={styles.cap}>
              <Badge keputusan={keputusan} />
            </span>
            <span>{KEPUTUSAN_LABEL[keputusan].meaning}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
