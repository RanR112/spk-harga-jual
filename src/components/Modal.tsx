import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';
import styles from './Modal.module.scss';

interface ModalProps {
  title: string;
  /** Elemen tambahan di samping judul, misalnya badge. */
  titleAddon?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Dialog modal: fokus pindah ke dalam saat dibuka, Tab berputar di dalam dialog,
 * `Esc` dan klik latar menutup, fokus kembali ke pemicu saat ditutup.
 */
export function Modal({ title, titleAddon, onClose, children }: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) {
        event.preventDefault();
        return;
      }
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === dialogRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !dialogRef.current.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = overflow;
      trigger?.focus();
    };
  }, []);

  return createPortal(
    <div
      className={styles.overlay}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className={styles.header}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          {titleAddon}
        </header>
        <div className={styles.body}>{children}</div>
        <footer className={styles.footer}>
          <Button onClick={onClose}>Tutup</Button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
