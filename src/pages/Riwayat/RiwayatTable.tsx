import { useMemo, useState } from 'react';
import type { Keputusan, RiwayatRow } from '@/api/types';
import { Badge } from '@/components/Badge';
import { DataTable, type Column } from '@/components/DataTable';
import { FormField } from '@/components/FormField';
import { KEPUTUSAN_LABEL, TEXT } from '@/constants/text';
import { formatDate, formatPercent, formatRupiah } from '@/utils/format';
import styles from './RiwayatTable.module.scss';

const COLUMNS: Column<RiwayatRow>[] = [
  { key: 'tanggal', header: 'Tanggal', nowrap: true, render: (row) => formatDate(row.tanggal) },
  { key: 'produk', header: 'Produk', render: (row) => row.nama_produk || '-' },
  { key: 'hpp', header: 'HPP', numeric: true, render: (row) => formatRupiah(row.hpp) },
  {
    key: 'perubahan',
    header: 'Perubahan',
    numeric: true,
    render: (row) => formatPercent(row.perubahan_hpp_persen, { signed: true }),
  },
  { key: 'margin', header: 'Margin', numeric: true, render: (row) => formatPercent(row.margin_persen) },
  { key: 'keputusan', header: 'Keputusan', render: (row) => <Badge keputusan={row.keputusan} /> },
  { key: 'harga_saran', header: 'Harga saran', numeric: true, render: (row) => formatRupiah(row.harga_saran) },
];

/** Terbaru di atas; dalam tanggal yang sama, mengikuti urutan baris di sheet. */
function sortNewestFirst(rows: RiwayatRow[]): RiwayatRow[] {
  return [...rows].sort((a, b) => b.tanggal.localeCompare(a.tanggal) || a.urut - b.urut);
}

const ALL = '';
const KEPUTUSAN_OPTIONS = Object.keys(KEPUTUSAN_LABEL) as Keputusan[];

export function RiwayatTable({ rows }: { rows: RiwayatRow[] }) {
  const [tanggal, setTanggal] = useState(ALL);
  const [keputusan, setKeputusan] = useState(ALL);
  const sorted = useMemo(() => sortNewestFirst(rows), [rows]);
  const dates = useMemo(() => [...new Set(sorted.map((row) => row.tanggal))], [sorted]);
  const filtered = sorted.filter(
    (row) => (tanggal === ALL || row.tanggal === tanggal) && (keputusan === ALL || row.keputusan === keputusan),
  );

  return (
    <>
      <div className={styles.filters}>
        <FormField label="Tanggal">
          {(field) => (
            <select {...field} value={tanggal} onChange={(event) => setTanggal(event.target.value)}>
              <option value={ALL}>Semua tanggal</option>
              {dates.map((date) => (
                <option key={date} value={date}>
                  {formatDate(date)}
                </option>
              ))}
            </select>
          )}
        </FormField>
        <FormField label="Keputusan">
          {(field) => (
            <select {...field} value={keputusan} onChange={(event) => setKeputusan(event.target.value)}>
              <option value={ALL}>Semua keputusan</option>
              {KEPUTUSAN_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {KEPUTUSAN_LABEL[option].label}
                </option>
              ))}
            </select>
          )}
        </FormField>
      </div>
      <p className={styles.count} aria-live="polite">
        Menampilkan {filtered.length} baris dari {new Set(filtered.map((row) => row.tanggal)).size} tanggal.
      </p>
      <DataTable
        columns={COLUMNS}
        rows={filtered}
        rowKey={(row) => `${row.tanggal}-${row.id_produk}-${row.urut}`}
        caption="Riwayat keputusan harga"
        emptyMessage={TEXT.emptyRiwayatFiltered}
      />
    </>
  );
}
