import { useState } from 'react';
import { api } from '@/api/endpoints';
import { errorMessage } from '@/api/client';
import { AsyncContent } from '@/components/AsyncContent';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { StatusMessage } from '@/components/StatusMessage';
import { KEPUTUSAN_LABEL, TEXT, emptyFilterTitle, ruleSummary, simpanRiwayatMessage } from '@/constants/text';
import { useDashboard } from '@/context/dashboardContext';
import { useToast } from '@/context/toastContext';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatDate } from '@/utils/format';
import { CapLegend } from './CapLegend';
import { MovingIngredients } from './MovingIngredients';
import { ProductDialog } from './ProductDialog';
import { RecommendationTable } from './RecommendationTable';
import { Ringkasan, type Filter } from './Ringkasan';
import styles from './Dashboard.module.scss';

export function Dashboard() {
  useDocumentTitle('Dashboard');
  const dashboard = useDashboard();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSaveHistory() {
    setSaving(true);
    try {
      const result = await api.simpanKeRiwayat();
      showToast('success', simpanRiwayatMessage(formatDate(result.tanggal), result.disimpan, result.dilewati));
    } catch (error) {
      showToast('error', errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AsyncContent
      data={dashboard.data}
      error={dashboard.error}
      loading={dashboard.loading}
      onRetry={dashboard.reload}
      isEmpty={() => false}
      emptyMessage={TEXT.emptyRekomendasi}
      loadingMessage="Memuat rekomendasi..."
    >
      {({ rekomendasi, bahan }) => {
        const items =
          filter === 'all' ? rekomendasi.items : rekomendasi.items.filter((item) => item.keputusan === filter);
        const selected = rekomendasi.items.find((item) => item.id_produk === selectedId);
        const totalEmpty = rekomendasi.items.length === 0;

        return (
          <div className={styles.page}>
            <section className={styles.summary} aria-label="Ringkasan dan penyaring">
              <Ringkasan ringkasan={rekomendasi.ringkasan} active={filter} onChange={setFilter} />
              <Button className={styles.save} variant="primary" onClick={handleSaveHistory} busy={saving} disabled={totalEmpty}>
                <Icon name="simpan" />
                {saving ? 'Menyimpan...' : 'Simpan ke riwayat'}
              </Button>
            </section>
            <p className={styles.hint}>
              {TEXT.hppExplain} {TEXT.rowHint}
            </p>
            <p className={`${styles.hint} ${styles.phoneOnly}`}>{TEXT.priceFlowHint}</p>

            {items.length === 0 ? (
              <StatusMessage
                variant="empty"
                title={totalEmpty || filter === 'all' ? undefined : emptyFilterTitle(KEPUTUSAN_LABEL[filter].cap)}
                action={totalEmpty ? undefined : { label: TEXT.showAll, onClick: () => setFilter('all') }}
              >
                {totalEmpty ? TEXT.emptyRekomendasi : TEXT.emptyFiltered}
              </StatusMessage>
            ) : (
              <RecommendationTable items={items} pengaturan={rekomendasi.pengaturan} onSelect={setSelectedId} />
            )}

            <div className={styles.lower}>
              <MovingIngredients bahan={bahan} />
              <CapLegend />
            </div>

            <p className={styles.footnote}>
              <b>{TEXT.ruleLabel}</b> {ruleSummary(rekomendasi.pengaturan)}
            </p>

            {selected && <ProductDialog item={selected} onClose={() => setSelectedId(null)} />}
          </div>
        );
      }}
    </AsyncContent>
  );
}
