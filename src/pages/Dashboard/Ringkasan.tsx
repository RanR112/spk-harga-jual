import type { Keputusan, Ringkasan as RingkasanData } from '@/api/types';
import { KeputusanIcon } from '@/components/KeputusanIcon';
import { KEPUTUSAN_LABEL, type KeputusanKey } from '@/constants/text';
import styles from './Ringkasan.module.scss';

export type Filter = 'all' | Keputusan;

interface ItemSpec {
  filter: Keputusan;
  label: string;
  count: (ringkasan: RingkasanData) => number;
}

const ITEMS: ItemSpec[] = [
  { filter: 'NAIKKAN HARGA', label: 'naik', count: (r) => r.naik },
  { filter: 'BERI PROMO', label: 'promo', count: (r) => r.promo },
  { filter: 'PERTAHANKAN', label: 'tahan', count: (r) => r.tahan },
  { filter: 'DATA TIDAK LENGKAP', label: 'data belum lengkap', count: (r) => r.data },
];

const TONE: Record<KeputusanKey, string> = {
  naik: styles.naik ?? '',
  promo: styles.promo ?? '',
  tahan: styles.tahan ?? '',
  data: styles.data ?? '',
};

interface RingkasanProps {
  ringkasan: RingkasanData;
  active: Filter;
  onChange: (filter: Filter) => void;
}

/**
 * Ringkasan satu baris yang sekaligus menjadi filter tabel: "9 produk · ▲ 4 naik · ▼ 2 promo · ● 3 tahan".
 * Mengklik bagian yang sudah aktif kembali ke semua produk.
 */
export function Ringkasan({ ringkasan, active, onChange }: RingkasanProps) {
  // Bagian "data belum lengkap" hanya tampil kalau memang ada produknya.
  const items = ITEMS.filter((item) => item.filter !== 'DATA TIDAK LENGKAP' || ringkasan.data > 0);
  return (
    <div className={styles.row} role="group" aria-label="Saring menurut keputusan">
      <button
        type="button"
        className={styles.filter}
        aria-pressed={active === 'all'}
        onClick={() => onChange('all')}
      >
        <b>{ringkasan.total}</b> produk
      </button>
      {items.map((item) => {
        const key = KEPUTUSAN_LABEL[item.filter].key;
        const pressed = active === item.filter;
        return (
          <span key={item.filter} className={styles.part}>
            <span className={styles.sep} aria-hidden="true">
              ·
            </span>
            <button
              type="button"
              className={`${styles.filter} ${TONE[key]}`}
              aria-pressed={pressed}
              onClick={() => onChange(pressed ? 'all' : item.filter)}
            >
              <KeputusanIcon name={key} />
              <b>{item.count(ringkasan)}</b> {item.label}
            </button>
          </span>
        );
      })}
    </div>
  );
}
