import type { RincianBahan } from '@/api/types';
import { formatNumber, formatPercent, formatRupiah } from '@/utils/format';
import styles from './RincianTable.module.scss';

interface RincianTableProps {
  /** Dipakai untuk nama tabel bagi pembaca layar. */
  caption: string;
  rows: RincianBahan[];
  /** HPP sekarang, ditampilkan di baris penutup. */
  total: number | null;
}

/**
 * Tabel mini rincian bahan penyusun HPP. Di HP kolom Takaran dan Harga rata-rata disembunyikan dan
 * isinya pindah ke baris kecil di bawah nama bahan.
 */
export function RincianTable({ caption, rows, total }: RincianTableProps) {
  return (
    <table className={styles.table}>
      <caption className="visually-hidden">{caption}</caption>
      <thead>
        <tr>
          <th scope="col">Bahan</th>
          <th scope="col" className={`${styles.num} ${styles.hideOnPhone}`}>
            Takaran
          </th>
          <th scope="col" className={`${styles.num} ${styles.hideOnPhone}`}>
            Harga rata-rata
          </th>
          <th scope="col" className={styles.num}>
            Biaya
          </th>
          <th scope="col" className={styles.num}>
            Porsi
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.bahan}>
            <td>
              {row.bahan}
              <span className={styles.sub}>
                {formatNumber(row.takaran)} {row.satuan} × {formatRupiah(row.harga_rata2)}
              </span>
            </td>
            <td className={`${styles.num} ${styles.hideOnPhone}`}>
              {formatNumber(row.takaran)} {row.satuan}
            </td>
            <td className={`${styles.num} ${styles.hideOnPhone}`}>
              {formatRupiah(row.harga_rata2)}/{row.satuan}
            </td>
            <td className={styles.num}>{formatRupiah(row.biaya)}</td>
            <td className={styles.num}>
              <span className={styles.bar} aria-hidden="true">
                <i style={{ width: `${Math.min(100, Math.max(0, row.porsi_persen ?? 0))}%` }} />
              </span>
              {formatPercent(row.porsi_persen)}
            </td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr>
          <th scope="row">HPP sekarang</th>
          <td className={styles.hideOnPhone} />
          <td className={styles.hideOnPhone} />
          <td className={styles.num}>{formatRupiah(total)}</td>
          <td />
        </tr>
      </tfoot>
    </table>
  );
}
