import { screen, waitFor } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { TEXT } from '@/constants/text';
import { renderApp } from '@/test/render';
import { callsTo, respondWith } from '@/test/server';

async function renderPengaturan() {
  const view = renderApp('/pengaturan');
  await screen.findByRole('button', { name: 'Simpan pengaturan' });
  return view;
}

describe('Pengaturan', () => {
  it('mengisi enam field dari getPengaturan, lengkap dengan label dan teks bantu', async () => {
    await renderPengaturan();
    expect(screen.getByLabelText('Batas HPP naik (%)')).toHaveValue(10);
    expect(screen.getByLabelText('Batas HPP turun (%)')).toHaveValue(10);
    expect(screen.getByLabelText('Margin target (%)')).toHaveValue(45);
    expect(screen.getByLabelText('Margin minimum (%)')).toHaveValue(35);
    expect(screen.getByLabelText('Pembulatan harga (Rp)')).toHaveValue(500);
    expect(screen.getByLabelText('Periode rata-rata (hari)')).toHaveValue(7);
    expect(screen.getByLabelText('Margin target (%)')).toHaveAccessibleDescription(
      'Dipakai untuk menghitung harga saran.',
    );
  });

  it('menyimpan lewat POST lalu memuat ulang dashboard', async () => {
    const { user } = await renderPengaturan();
    expect(callsTo('getDashboard')).toHaveLength(1);

    const field = screen.getByLabelText('Batas HPP naik (%)');
    await user.clear(field);
    await user.type(field, '12');
    await user.click(screen.getByRole('button', { name: 'Simpan pengaturan' }));

    expect(await screen.findByText(TEXT.pengaturanSaved)).toBeInTheDocument();
    const [request] = callsTo('savePengaturan');
    expect(request?.contentType).toBe('text/plain;charset=utf-8');
    expect(request?.body).toMatchObject({ action: 'savePengaturan', payload: { batas_naik_persen: 12, pembulatan: 500 } });
    await waitFor(() => expect(callsTo('getDashboard')).toHaveLength(2));
  });

  it('menampilkan galat validasi dari server apa adanya', async () => {
    const message = 'Margin target tidak boleh lebih kecil dari margin minimum.';
    respondWith('savePengaturan', () => HttpResponse.json({ ok: false, error: message }));
    const { user } = await renderPengaturan();

    const field = screen.getByLabelText('Margin target (%)');
    await user.clear(field);
    await user.type(field, '20');
    await user.click(screen.getByRole('button', { name: 'Simpan pengaturan' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(callsTo('getDashboard')).toHaveLength(1);
  });

  it('menolak field kosong tanpa memanggil API', async () => {
    const { user } = await renderPengaturan();
    await user.clear(screen.getByLabelText('Pembulatan harga (Rp)'));
    await user.click(screen.getByRole('button', { name: 'Simpan pengaturan' }));
    expect(await screen.findByText(TEXT.pengaturanInvalid)).toBeInTheDocument();
    expect(callsTo('savePengaturan')).toHaveLength(0);
  });
});
