import { useId, type ReactNode } from 'react';
import styles from './FormField.module.scss';

interface FieldProps {
  id: string;
  'aria-describedby'?: string;
}

interface FormFieldProps {
  label: string;
  help?: ReactNode;
  /** Menerima `id` dan `aria-describedby` yang harus dipasang ke elemen input. */
  children: (props: FieldProps) => ReactNode;
}

/** Label yang terhubung lewat `htmlFor` beserta teks bantu yang terhubung lewat `aria-describedby`. */
export function FormField({ label, help, children }: FormFieldProps) {
  const id = useId();
  const helpId = `${id}-help`;
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      {children({ id, 'aria-describedby': help ? helpId : undefined })}
      {help && (
        <p id={helpId} className={styles.help}>
          {help}
        </p>
      )}
    </div>
  );
}
