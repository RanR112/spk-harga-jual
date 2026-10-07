import { api } from '@/api/endpoints';
import { AsyncContent } from '@/components/AsyncContent';
import { TEXT } from '@/constants/text';
import { useApi } from '@/hooks/useApi';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { BahanChartCard } from './BahanChartCard';
import { HppChartCard } from './HppChartCard';
import styles from './Tren.module.scss';

const TREN_DAYS = 60;
const fetchTren = () => api.getTrenData(TREN_DAYS);

export function Tren() {
  useDocumentTitle('Tren harga');
  const tren = useApi(fetchTren);

  return (
    <AsyncContent
      data={tren.data}
      error={tren.error}
      loading={tren.loading}
      onRetry={tren.reload}
      isEmpty={(data) => data.dates.length === 0}
      emptyMessage={TEXT.emptyBahan}
      loadingMessage="Memuat data tren..."
    >
      {(data) => (
        <div className={styles.page}>
          <h2 className={styles.title}>Tren harga</h2>
          <HppChartCard data={data} />
          <BahanChartCard data={data} />
        </div>
      )}
    </AsyncContent>
  );
}
