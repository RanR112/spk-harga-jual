import { useId, type ReactNode } from 'react';
import styles from './Card.module.scss';

interface CardProps {
  title?: string;
  /** Elemen di kanan judul, misalnya tombol aksi. */
  actions?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
  /** `box` memberi tepi hijau seperti kotak isian di buku kas, untuk halaman formulir. Bawaan: tanpa kotak. */
  variant?: 'plain' | 'box';
  /** Tingkat judul. Bawaan h2; pakai 3 bila kartu berada di bawah judul halaman. */
  headingLevel?: 2 | 3;
}

export function Card({ title, actions, footer, children, className, variant = 'plain', headingLevel = 2 }: CardProps) {
  const Heading = headingLevel === 3 ? 'h3' : 'h2';
  const titleId = useId();
  const classes = [styles.card, variant === 'box' ? styles.box : '', className].filter(Boolean).join(' ');
  return (
    <section className={classes} aria-labelledby={title ? titleId : undefined}>
      {(title || actions) && (
        <header className={styles.header}>
          {title && (
            <Heading id={titleId} className={styles.title}>
              {title}
            </Heading>
          )}
          {actions && <div className={styles.actions}>{actions}</div>}
        </header>
      )}
      {children}
      {footer && <div className={styles.footer}>{footer}</div>}
    </section>
  );
}
