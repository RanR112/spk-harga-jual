import { Outlet, useLocation } from 'react-router-dom';
import { isDemoMode } from '@/api/endpoints';
import { activeTab } from '@/constants/tabs';
import { DemoBanner } from './DemoBanner';
import { Header } from './Header';
import { ToastRegion } from './ToastRegion';
import styles from './Layout.module.scss';

export function Layout() {
  const { pathname } = useLocation();
  const tab = activeTab(pathname);
  return (
    <div className={styles.app}>
      <a className={styles.skip} href="#main-panel" onClick={(event) => {
        // Dengan HashRouter, href "#main-panel" akan dianggap rute. Fokus dipindah manual.
        event.preventDefault();
        document.getElementById('main-panel')?.focus();
      }}>
        Lewati ke konten
      </a>
      {isDemoMode && <DemoBanner />}
      <Header />
      <main id="main-panel" role="tabpanel" aria-labelledby={tab?.id} tabIndex={-1} className={styles.main}>
        <Outlet />
      </main>
      <ToastRegion />
    </div>
  );
}
