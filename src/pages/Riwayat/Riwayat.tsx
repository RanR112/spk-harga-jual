import { api } from '@/api/endpoints';
import { AsyncContent } from '@/components/AsyncContent';
import { Card } from '@/components/Card';
import { TEXT } from '@/constants/text';
import { useApi } from '@/hooks/useApi';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { RiwayatTable } from './RiwayatTable';

const RIWAYAT_LIMIT = 300;
const fetchRiwayat = () => api.getRiwayat(RIWAYAT_LIMIT);

export function Riwayat() {
  useDocumentTitle('Riwayat');
  const riwayat = useApi(fetchRiwayat);

  return (
    <Card title="Riwayat keputusan" variant="box">
      <AsyncContent
        data={riwayat.data}
        error={riwayat.error}
        loading={riwayat.loading}
        onRetry={riwayat.reload}
        emptyMessage={TEXT.emptyRiwayat}
        loadingMessage="Memuat riwayat..."
      >
        {(rows) => <RiwayatTable rows={rows} />}
      </AsyncContent>
    </Card>
  );
}
