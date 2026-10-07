import type { Keputusan, Pengaturan, Rekomendasi } from '@/api/types';
import { Badge } from '@/components/Badge';
import { Icon } from '@/components/Icon';
import { KeputusanIcon } from '@/components/KeputusanIcon';
import { KEPUTUSAN_LABEL, KEPUTUSAN_ORDER, TEXT, groupRule } from '@/constants/text';
import { formatRupiah } from '@/utils/format';
import { ProductName } from './ProductName';
import { RecommendationCell } from './RecommendationCell';
import styles from './RecommendationTable.module.scss';

interface RecommendationTableProps {
  items: Rekomendasi[];
  pengaturan: Pengaturan;
  onSelect: (id: string) => void;
}

interface Group {
  keputusan: Keputusan;
  items: Rekomendasi[];
}

/** Mengelompokkan baris menurut keputusan, dengan urutan tetap naik, promo, tahan, data. */
function groupItems(items: Rekomendasi[]): Group[] {
  return KEPUTUSAN_ORDER.map((keputusan) => ({
    keputusan,
    items: items.filter((item) => item.keputusan === keputusan),
  })).filter((group) => group.items.length > 0);
}

function UrgencyNote({ urgensi }: { urgensi: Rekomendasi['urgensi'] }) {
  if (!urgensi) return null;
  const className = urgensi === 'Tinggi' ? `${styles.urgency} ${styles.urgencyHigh}` : styles.urgency;
  return <span className={className}>Urgensi {urgensi.toLowerCase()}</span>;
}

function ChangeCell({ item }: { item: Rekomendasi }) {
  if (item.keputusan === 'NAIKKAN HARGA') {
    return <span className={styles.rise}>{formatRupiah(item.kenaikan_rp, { signed: true })}</span>;
  }
  return (
    <>
      <span className={styles.none} aria-hidden="true">
        –
      </span>
      <span className="visually-hidden">{TEXT.noPriceChange}</span>
    </>
  );
}

/**
 * Tabel utama dashboard: lima kolom, dikelompokkan menurut keputusan. Di bawah 960px tiap baris berubah
 * menjadi entri dua baris lewat CSS. Karena `display` tabel diganti, peran ARIA ditulis eksplisit
 * supaya pembaca layar tetap mengenalinya sebagai tabel.
 */
export function RecommendationTable({ items, pengaturan, onSelect }: RecommendationTableProps) {
  const groups = groupItems(items);

  return (
    <table className={styles.table} role="table">
      <caption className="visually-hidden">Rekomendasi harga per produk</caption>
      <colgroup>
        <col className={styles.colProduk} />
        <col className={styles.colSekarang} />
        <col className={styles.colSaran} />
        <col className={styles.colSelisih} />
        <col className={styles.colPutusan} />
      </colgroup>
      <thead role="rowgroup">
        <tr role="row">
          <th scope="col" role="columnheader">
            Produk
          </th>
          <th scope="col" role="columnheader" className={styles.num}>
            Harga sekarang
          </th>
          <th scope="col" role="columnheader" className={styles.num}>
            Harga saran
          </th>
          <th scope="col" role="columnheader" className={styles.num}>
            Selisih
          </th>
          <th scope="col" role="columnheader">
            Keputusan
          </th>
        </tr>
      </thead>
      {groups.map((group) => {
        const style = KEPUTUSAN_LABEL[group.keputusan];
        return (
          <tbody key={group.keputusan} role="rowgroup">
            <tr role="row" className={styles.groupRow}>
              <th scope="colgroup" colSpan={5} role="rowheader">
                <div className={styles.groupContent}>
                  <span className={`${styles.groupName} ${styles[style.key]}`}>
                    <KeputusanIcon name={style.key} />
                    {style.label} <span className={styles.groupCount}>· {group.items.length}</span>
                  </span>
                  <span className={styles.groupRule}>{groupRule(group.keputusan, pengaturan)}</span>
                </div>
              </th>
            </tr>
            {group.items.map((item) => (
                <tr
                  key={item.id_produk}
                  role="row"
                  className={styles.row}
                  data-keputusan={style.key}
                  // Seluruh baris bisa diklik; tombol nama di dalamnya tetap jalan masuk bagi keyboard.
                  onClick={() => onSelect(item.id_produk)}
                >
                  <td role="cell" className={styles.cProduk}>
                    <button type="button" className={styles.open} aria-haspopup="dialog">
                      <Icon name="panah" size={16} className={styles.arrow} />
                      <span className={styles.nameBlock}>
                        <span className={styles.name}>
                          <ProductName name={item.nama_produk} />
                        </span>
                        <span className={styles.kode} aria-hidden="true">
                          {item.id_produk}
                        </span>
                      </span>
                    </button>
                  </td>
                  <td role="cell" className={`${styles.num} ${styles.cSekarang}`}>
                    {formatRupiah(item.harga_jual)}
                  </td>
                  <td role="cell" className={styles.cSaran}>
                    <RecommendationCell item={item} />
                  </td>
                  <td role="cell" className={`${styles.num} ${styles.cSelisih}`}>
                    <ChangeCell item={item} />
                  </td>
                  <td role="cell" className={styles.cPutusan}>
                    <Badge keputusan={item.keputusan} />
                    {item.keputusan === 'NAIKKAN HARGA' && <UrgencyNote urgensi={item.urgensi} />}
                  </td>
                </tr>
            ))}
          </tbody>
        );
      })}
    </table>
  );
}
