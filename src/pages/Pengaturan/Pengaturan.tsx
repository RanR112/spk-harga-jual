import { api } from '@/api/endpoints';
import { AsyncContent } from '@/components/AsyncContent';
import { Card } from '@/components/Card';
import { useDashboard } from '@/context/dashboardContext';
import { useApi } from '@/hooks/useApi';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { PengaturanForm } from './PengaturanForm';
import styles from './Pengaturan.module.scss';

export function Pengaturan() {
  useDocumentTitle('Pengaturan');
  const pengaturan = useApi(api.getPengaturan);
  const { reload: reloadDashboard } = useDashboard();

  return (
    <div className={styles.page}>
      {/* Form diberi key dari isi data agar terisi ulang kalau "Muat ulang" membawa nilai baru. */}
      <Card title="Pengaturan aturan keputusan" variant="box">
        <AsyncContent
          data={pengaturan.data}
          error={pengaturan.error}
          loading={pengaturan.loading}
          onRetry={pengaturan.reload}
          isEmpty={() => false}
          emptyMessage=""
          loadingMessage="Memuat pengaturan..."
        >
          {(data) => <PengaturanForm key={JSON.stringify(data)} initial={data} onSaved={reloadDashboard} />}
        </AsyncContent>
      </Card>
    </div>
  );
}
