import type { Rekomendasi } from '@/api/types';
import { formatPercent, formatRupiah } from '@/utils/format';
import styles from './RecommendationCell.module.scss';

/**
 * Isi kolom "Harga saran": berbeda untuk tiap keputusan, semua angka sudah dihitung backend.
 * Mengembalikan fragmen, karena di layar HP sel induknya `display: contents` dan tiap bagian
 * ditempatkan sendiri-sendiri di grid baris.
 */
export function RecommendationCell({ item }: { item: Rekomendasi }) {
  switch (item.keputusan) {
    case 'NAIKKAN HARGA':
      return <span className={styles.price}>{formatRupiah(item.harga_saran)}</span>;
    case 'BERI PROMO':
      return (
        <>
          <span className={styles.fixed}>harga tetap</span>
          <span className={styles.note}>
            diskon aman maks <b>{formatPercent(item.diskon_maks_persen)}</b>
          </span>
          {item.hemat_per_porsi !== null && (
            <span className={`${styles.note} ${styles.small}`}>hemat {formatRupiah(item.hemat_per_porsi)} per porsi</span>
          )}
        </>
      );
    case 'PERTAHANKAN':
      return <span className={styles.fixed}>harga tetap</span>;
    default:
      return (
        <>
          <span className={styles.fixed}>belum bisa dihitung</span>
          <span className={`${styles.note} ${styles.small}`}>{item.keterangan || '-'}</span>
        </>
      );
  }
}
