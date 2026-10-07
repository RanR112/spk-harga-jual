import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.scss';

type Variant = 'primary' | 'secondary';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** Saat `true`, tombol dinonaktifkan dan diberi `aria-busy`. */
  busy?: boolean;
}

export function Button({ variant = 'secondary', busy = false, disabled, className, type = 'button', ...rest }: ButtonProps) {
  const classes = [styles.button, styles[variant], className].filter(Boolean).join(' ');
  return <button type={type} className={classes} disabled={disabled || busy} aria-busy={busy || undefined} {...rest} />;
}
