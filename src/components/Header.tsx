import { TEXT } from '@/constants/text';
import { useDashboard } from '@/context/dashboardContext';
import { useRefresh } from '@/context/refreshContext';
import { formatDate } from '@/utils/format';
import { Icon } from './Icon';
import { ReloadButton } from './ReloadButton';
import { TabNav } from './TabNav';
import { ThemeToggle } from './ThemeToggle';
import styles from './Header.module.scss';

export function Header() {
  const { data, loading, error } = useDashboard();
  const { refreshAll } = useRefresh();

  let stamp: string = TEXT.loadingData;
  if (data) stamp = `Data per ${formatDate(data.rekomendasi.tanggal_data)}`;
  else if (error) stamp = 'Data belum tersedia';

  return (
    <header className={styles.header}>
      <div className={styles.wrap}>
        <div className={styles.inner}>
          <div className={styles.brand}>
            <Icon name="merek" size={44} className={styles.logo} />
            <div className={styles.titles}>
              <h1 className={styles.title}>{TEXT.appTitle}</h1>
              <p className={styles.subtitle}>{TEXT.appSubtitle}</p>
            </div>
          </div>
          <div className={styles.actions}>
            <span className={styles.stamp} aria-live="polite">
              {stamp}
            </span>
            <div className={styles.reload}>
              <ReloadButton onClick={refreshAll} loading={loading} />
            </div>
            <div className={styles.theme}>
              <ThemeToggle />
            </div>
          </div>
        </div>
        <TabNav />
      </div>
    </header>
  );
}
