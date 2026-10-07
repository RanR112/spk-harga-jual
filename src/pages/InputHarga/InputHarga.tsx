import { useCallback } from 'react';
import { api } from '@/api/endpoints';
import type { InputHarga as InputHargaRow } from '@/api/types';
import { AsyncContent } from '@/components/AsyncContent';
import { Card } from '@/components/Card';
import { DataTable, type Column } from '@/components/DataTable';
import { TEXT } from '@/constants/text';
import { useDashboard } from '@/context/dashboardContext';
import { useApi } from '@/hooks/useApi';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatDate, formatRupiah } from '@/utils/format';
import { HargaForm } from './HargaForm';
import styles from './InputHarga.module.scss';

const HARGA_LIMIT = 15;
const fetchHarga = () => api.getHargaTerbaru(HARGA_LIMIT);

const COLUMNS: Column<InputHargaRow>[] = [
  { key: 'tanggal', header: 'Tanggal', nowrap: true, render: (row) => formatDate(row.tanggal) },
  { key: 'bahan', header: 'Bahan', render: (row) => row.bahan },
  { key: 'satuan', header: 'Satuan', render: (row) => row.satuan },
  { key: 'harga', header: 'Harga', numeric: true, render: (row) => formatRupiah(row.harga) },
];

export function InputHarga() {
  useDocumentTitle('Input harga');
  const harga = useApi(fetchHarga);
  const dashboard = useDashboard();
  const { reload: reloadHarga } = harga;
  const { reload: reloadDashboard } = dashboard;

  const handleSaved = useCallback(() => {
    reloadHarga();
    // Tanggal data di header dan rekomendasi ikut berubah setelah harga baru masuk.
    reloadDashboard();
  }, [reloadHarga, reloadDashboard]);

  return (
    <div className={styles.grid}>
      <Card title="Input harga bahan" variant="box">
        <AsyncContent
          data={dashboard.data}
          error={dashboard.error}
          loading={dashboard.loading}
          onRetry={dashboard.reload}
          isEmpty={(data) => data.bahan.length === 0}
          emptyMessage={TEXT.emptyBahan}
          loadingMessage="Memuat daftar bahan..."
        >
          {(data) => <HargaForm bahan={data.bahan} onSaved={handleSaved} />}
        </AsyncContent>
      </Card>

      <Card title={`${HARGA_LIMIT} input terakhir`} variant="box">
        <AsyncContent
          data={harga.data}
          error={harga.error}
          loading={harga.loading}
          onRetry={harga.reload}
          emptyMessage={TEXT.emptyHargaInput}
          loadingMessage="Memuat riwayat input..."
        >
          {(rows) => (
            <DataTable
              columns={COLUMNS}
              rows={rows}
              rowKey={(row) => `${row.urut}-${row.tanggal}-${row.bahan}`}
              caption="Input harga bahan terakhir"
              emptyMessage={TEXT.emptyHargaInput}
            />
          )}
        </AsyncContent>
      </Card>
    </div>
  );
}
