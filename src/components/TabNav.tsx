import { useRef, type KeyboardEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { TABS, activeTab } from '@/constants/tabs';
import styles from './TabNav.module.scss';

/**
 * Navigasi tab. Mengikuti pola tablist: hanya tab aktif yang masuk urutan Tab,
 * panah kiri/kanan, Home, dan End memindah fokus, Enter atau Spasi membuka tab.
 */
export function TabNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const refs = useRef<(HTMLAnchorElement | null)[]>([]);
  const current = activeTab(pathname);

  function handleKeyDown(event: KeyboardEvent<HTMLAnchorElement>, index: number) {
    const last = TABS.length - 1;
    const target: Record<string, number> = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    };
    const next = target[event.key];
    if (next !== undefined) {
      event.preventDefault();
      refs.current[next]?.focus();
      return;
    }
    const tab = TABS[index];
    if (event.key === ' ' && tab) {
      event.preventDefault();
      navigate(tab.to);
    }
  }

  return (
    <nav className={styles.nav} aria-label="Menu utama">
      <div className={styles.list} role="tablist">
        {TABS.map((tab, index) => {
          const selected = tab === current;
          return (
            <Link
              key={tab.id}
              id={tab.id}
              ref={(element) => {
                refs.current[index] = element;
              }}
              to={tab.to}
              role="tab"
              aria-selected={selected}
              aria-controls="main-panel"
              tabIndex={selected || (!current && index === 0) ? 0 : -1}
              className={selected ? `${styles.tab} ${styles.active}` : styles.tab}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
