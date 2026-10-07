import type { ReactNode } from 'react';
import { StatusMessage } from './StatusMessage';
import styles from './DataTable.module.scss';

export interface Column<T> {
  key: string;
  header: string;
  /** Kolom angka: rata kanan dan `tabular-nums`. */
  numeric?: boolean;
  /** Isi sel tidak dipecah ke baris baru, misalnya tanggal. */
  nowrap?: boolean;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Judul tabel untuk pembaca layar. */
  caption: string;
  emptyMessage: string;
  footer?: ReactNode;
}

function cellClass<T>(column: Column<T>): string | undefined {
  if (column.numeric) return styles.num;
  if (column.nowrap) return styles.nowrap;
  return undefined;
}

/** Tabel yang dibungkus wadah bergeser mendatar, jadi halaman tidak ikut melebar di layar HP. */
export function DataTable<T>({ columns, rows, rowKey, caption, emptyMessage, footer }: DataTableProps<T>) {
  if (rows.length === 0) return <StatusMessage variant="empty">{emptyMessage}</StatusMessage>;
  return (
    // tabIndex agar wadah yang bisa digeser juga bisa digeser lewat keyboard.
    <div className={styles.scroller} tabIndex={0} role="region" aria-label={caption}>
      <table className={styles.table}>
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className={cellClass(column)}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column) => (
                <td key={column.key} className={cellClass(column)}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {footer && <tfoot>{footer}</tfoot>}
      </table>
    </div>
  );
}
