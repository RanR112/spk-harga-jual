import { useState, type FormEvent } from 'react';
import { api } from '@/api/endpoints';
import { errorMessage } from '@/api/client';
import type { Pengaturan } from '@/api/types';
import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { TEXT } from '@/constants/text';
import { useToast } from '@/context/toastContext';
import styles from './PengaturanForm.module.scss';

interface FieldSpec {
  name: keyof Pengaturan;
  label: string;
  help: string;
  step: string;
}

const FIELDS: FieldSpec[] = [
  {
    name: 'batas_naik_persen',
    label: 'Batas HPP naik (%)',
    help: 'Jika HPP naik sebesar ini atau lebih dari baseline, sistem menyarankan menaikkan harga.',
    step: '0.1',
  },
  {
    name: 'batas_turun_persen',
    label: 'Batas HPP turun (%)',
    help: 'Jika HPP turun sebesar ini atau lebih, sistem menyarankan promo atau diskon.',
    step: '0.1',
  },
  {
    name: 'margin_target_persen',
    label: 'Margin target (%)',
    help: 'Dipakai untuk menghitung harga saran.',
    step: '0.1',
  },
  {
    name: 'margin_minimum_persen',
    label: 'Margin minimum (%)',
    help: 'Margin di bawah angka ini memicu saran naik harga, dan menjadi batas aman diskon.',
    step: '0.1',
  },
  {
    name: 'pembulatan',
    label: 'Pembulatan harga (Rp)',
    help: 'Harga saran dibulatkan ke atas ke kelipatan ini.',
    step: '1',
  },
  {
    name: 'periode_moving_average_hari',
    label: 'Periode rata-rata (hari)',
    help: 'Harga bahan dirata-rata selama N data terakhir agar lonjakan sesaat tidak langsung memicu keputusan.',
    step: '1',
  },
];

type FormValues = Record<keyof Pengaturan, string>;

function toFormValues(pengaturan: Pengaturan): FormValues {
  const entries = FIELDS.map((field) => [field.name, String(pengaturan[field.name] ?? '')]);
  return Object.fromEntries(entries) as FormValues;
}

function toPengaturan(values: FormValues): Pengaturan | null {
  const result: Partial<Pengaturan> = {};
  for (const field of FIELDS) {
    const raw = values[field.name].trim();
    const value = Number(raw);
    if (raw === '' || !Number.isFinite(value)) return null;
    result[field.name] = value;
  }
  return result as Pengaturan;
}

interface PengaturanFormProps {
  initial: Pengaturan;
  /** Dipanggil setelah tersimpan, agar dashboard dimuat ulang karena keputusan ikut berubah. */
  onSaved: (saved: Pengaturan) => void;
}

export function PengaturanForm({ initial, onSaved }: PengaturanFormProps) {
  const { showToast } = useToast();
  const [values, setValues] = useState<FormValues>(() => toFormValues(initial));
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = toPengaturan(values);
    if (!payload) {
      setServerError(null);
      showToast('error', TEXT.pengaturanInvalid);
      return;
    }
    setSaving(true);
    setServerError(null);
    try {
      const saved = await api.savePengaturan(payload);
      setValues(toFormValues(saved));
      showToast('success', TEXT.pengaturanSaved);
      onSaved(saved);
    } catch (error) {
      // Pesan validasi dari server ditampilkan apa adanya, di form dan sebagai toast.
      const message = errorMessage(error);
      setServerError(message);
      showToast('error', message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {FIELDS.map((field) => (
        <FormField key={field.name} label={field.label} help={field.help}>
          {(props) => (
            <input
              {...props}
              type="number"
              inputMode="decimal"
              step={field.step}
              value={values[field.name]}
              required
              onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))}
            />
          )}
        </FormField>
      ))}

      {serverError && (
        <p className={styles.error} role="alert">
          {serverError}
        </p>
      )}

      <div>
        <Button type="submit" variant="primary" busy={saving}>
          {saving ? 'Menyimpan...' : 'Simpan pengaturan'}
        </Button>
      </div>
    </form>
  );
}
