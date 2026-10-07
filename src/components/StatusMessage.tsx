import type { ReactNode } from 'react';
import { TEXT } from '@/constants/text';
import { Button } from './Button';
import { Icon } from './Icon';
import styles from './StatusMessage.module.scss';

type Variant = 'loading' | 'error' | 'empty';

interface StatusMessageProps {
  variant: Variant;
  children?: ReactNode;
  onRetry?: () => void;
  /** Hanya untuk keadaan kosong: tombol di bawah pesan, misalnya "Tampilkan semua produk". */
  action?: { label: string; onClick: () => void };
  /** Hanya untuk keadaan kosong: judul tebal di atas pesan. */
  title?: string;
}

const SKELETON_ROWS = 4;

/** Tampilan keadaan memuat, galat, dan kosong yang dipakai di semua halaman. */
export function StatusMessage({ variant, children, onRetry, action, title }: StatusMessageProps) {
  if (variant === 'loading') {
    return (
      <div className={styles.loading} role="status" aria-busy="true">
        <div aria-hidden="true">
          {Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <div key={index} className={styles.skeletonRow}>
              <span className={styles.skeleton} />
              <span className={`${styles.skeleton} ${styles.short}`} />
              <span className={`${styles.skeleton} ${styles.short}`} />
              <span className={`${styles.skeleton} ${styles.short}`} />
              <span className={styles.skeleton} />
            </div>
          ))}
        </div>
        <p className={styles.loadingText}>{children ?? TEXT.loading}</p>
      </div>
    );
  }
  if (variant === 'error') {
    return (
      <div className={styles.sheet}>
        <div className={`${styles.message} ${styles.error}`} role="alert">
          <Icon name="seru" size={36} className={styles.bigIcon} />
          <h3 className={styles.title}>{TEXT.errorTitle}</h3>
          <p>{children}</p>
          {onRetry && (
            <Button variant="primary" onClick={onRetry}>
              {TEXT.retry}
            </Button>
          )}
        </div>
      </div>
    );
  }
  return (
    <div className={styles.sheet}>
      <div className={styles.message}>
        <Icon name="buku" size={36} className={styles.bigIcon} />
        {title && <h3 className={styles.title}>{title}</h3>}
        <p className={title ? undefined : styles.emptyText}>{children}</p>
        {action && (
          <Button variant="primary" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}
