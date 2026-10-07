import { useState, type FormEvent } from 'react';
import { api } from '@/api/endpoints';
import { errorMessage } from '@/api/client';
import type { BahanInfo } from '@/api/types';
import { Button } from '@/components/Button';
import { FormField } from '@/components/FormField';
import { TEXT } from '@/constants/text';
import { useToast } from '@/context/toastContext';
import { formatDate, formatRupiah, todayIso } from '@/utils/format';
import styles from './HargaForm.module.scss';

interface HargaFormProps {
  bahan: BahanInfo[];
  /** Dipanggil setelah harga tersimpan agar tabel dan dashboard dimuat ulang. */
  onSaved: () => void;
}

export function HargaForm({ bahan, onSaved }: HargaFormProps) {
  const { showToast } = useToast();
  const [tanggal, setTanggal] = useState(() => todayIso());
  const [selected, setSelected] = useState(() => bahan[0]?.nama ?? '');
  const [harga, setHarga] = useState('');
  const [saving, setSaving] = useState(false);
  const info = bahan.find((item) => item.nama === selected);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(harga);
    // Validasi klien: ketiganya terisi dan harga > 0. Kalau gagal, API tidak dipanggil.
    if (!tanggal || !selected || harga.trim() === '' || !Number.isFinite(amount) || amount <= 0) {
      showToast('error', TEXT.inputInvalid);
      return;
    }
    setSaving(true);
    try {
      const result = await api.addHargaBahan({ tanggal, bahan: selected, harga: amount });
      showToast(
        'success',
        `Harga ${result.bahan} tanggal ${formatDate(result.tanggal)} tersimpan: ${formatRupiah(result.harga)}.`,
      );
      setHarga('');
      onSaved();
    } catch (error) {
      showToast('error', errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    // noValidate: validasi ditangani sendiri agar pesannya seragam dalam Bahasa Indonesia.
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <FormField label="Tanggal">
        {(field) => (
          <input {...field} type="date" value={tanggal} required onChange={(event) => setTanggal(event.target.value)} />
        )}
      </FormField>

      <FormField
        label="Bahan"
        help={info ? `Harga terakhir ${formatRupiah(info.harga_terakhir)} pada ${formatDate(info.tanggal_terakhir)}` : undefined}
      >
        {(field) => (
          <select {...field} value={selected} required onChange={(event) => setSelected(event.target.value)}>
            {bahan.map((item) => (
              <option key={item.nama} value={item.nama}>
                {item.nama} ({item.satuan})
              </option>
            ))}
          </select>
        )}
      </FormField>

      <FormField label={info ? `Harga per ${info.satuan} (Rp)` : 'Harga (Rp)'}>
        {(field) => (
          <input
            {...field}
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            value={harga}
            required
            placeholder="Contoh: 35000"
            onChange={(event) => setHarga(event.target.value)}
          />
        )}
      </FormField>

      <Button type="submit" variant="primary" busy={saving} className={styles.submit}>
        {saving ? 'Menyimpan...' : 'Simpan harga'}
      </Button>
      <p className={styles.note}>{TEXT.inputUpsertNote}</p>
    </form>
  );
}
