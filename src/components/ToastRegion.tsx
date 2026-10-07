import { useToast } from '@/context/toastContext';
import { Icon } from './Icon';
import styles from './ToastRegion.module.scss';

/** Wadah notifikasi di pojok kanan bawah. Selalu ada di DOM agar `aria-live` terbaca. */
export function ToastRegion() {
  const { toasts, dismissToast } = useToast();
  return (
    <div className={styles.region} aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`${styles.toast} ${styles[toast.type]}`}>
          <Icon name={toast.type === 'success' ? 'centang' : 'seru'} size={20} className={styles.icon} />
          <p className={styles.message}>{toast.message}</p>
          <button
            type="button"
            className={styles.close}
            onClick={() => dismissToast(toast.id)}
            aria-label="Tutup notifikasi"
          >
            <span aria-hidden="true">{'×'}</span>
          </button>
        </div>
      ))}
    </div>
  );
}
