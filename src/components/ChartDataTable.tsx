import { useState } from 'react';
import { formatDate, formatRupiah } from '@/utils/format';
import { Button } from './Button';
import { DataTable, type Column } from './DataTable';
import styles from './ChartDataTable.module.scss';

export interface ChartDataRow {
  /** Tanggal ISO. */
  date: string;
  value: number | null;
  /** Selisih untuk kolom ketiga (dari baseline atau dari hari sebelumnya). */
  diff: number | null;
}

interface ChartDataTableProps {
  /** Terbaru dulu. */
  rows: ChartDataRow[];
  caption: string;
  valueHeader: string;
  diffHeader: string;
}

const PREVIEW = 10;

/** Semua angka grafik dalam bentuk tabel, supaya bisa dibaca tanpa menyentuh grafik atau dengan pembaca layar. */
export function ChartDataTable({ rows, caption, valueHeader, diffHeader }: ChartDataTableProps) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? rows : rows.slice(0, PREVIEW);
  const columns: Column<ChartDataRow>[] = [
    { key: 'tanggal', header: 'Tanggal', nowrap: true, render: (row) => formatDate(row.date) },
    { key: 'nilai', header: valueHeader, numeric: true, render: (row) => formatRupiah(row.value) },
    { key: 'selisih', header: diffHeader, numeric: true, render: (row) => formatRupiah(row.diff, { signed: true }) },
  ];

  return (
    <div className={styles.wrapper}>
      <DataTable
        columns={columns}
        rows={shown}
        rowKey={(row) => row.date}
        caption={caption}
        emptyMessage="Belum ada data."
      />
      {rows.length > PREVIEW && (
        <Button aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
          {expanded ? `Tampilkan ${PREVIEW} terbaru saja` : `Tampilkan semua ${rows.length} tanggal`}
        </Button>
      )}
    </div>
  );
}
