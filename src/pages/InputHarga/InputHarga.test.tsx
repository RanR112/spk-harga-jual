import { screen, waitFor, within } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import dashboardFixture from '@fixtures/getDashboard.json';
import { TEXT } from '@/constants/text';
import { renderApp } from '@/test/render';
import { callsTo, respondWith } from '@/test/server';

async function renderInput() {
  const view = renderApp('/input');
  await screen.findByRole('table', { name: 'Input harga bahan terakhir' });
  await screen.findByRole('button', { name: 'Simpan harga' });
  return view;
}

describe('Input harga', () => {
  it('menampilkan 15 input terakhir', async () => {
    await renderInput();
    const table = screen.getByRole('table', { name: 'Input harga bahan terakhir' });
    expect(within(table).getAllByRole('row')).toHaveLength(16);
    expect(within(table).getAllByText('2 Okt 2026').length).toBeGreaterThan(0);
  });

  it('semua input punya label yang terhubung', async () => {
    await renderInput();
    expect(screen.getByLabelText('Tanggal')).toHaveAttribute('type', 'date');
    expect(screen.getByLabelText('Bahan').tagName).toBe('SELECT');
    expect(screen.getByLabelText(/^Harga per/)).toHaveAttribute('type', 'number');
  });

  it('menampilkan harga terakhir bahan yang dipilih', async () => {
    const { user } = await renderInput();
    await user.selectOptions(screen.getByLabelText('Bahan'), 'Telur ayam');
    const telur = dashboardFixture.data.bahan.find((item) => item.nama === 'Telur ayam');
    expect(telur).toBeDefined();
    expect(screen.getByLabelText('Bahan')).toHaveAccessibleDescription(
      new RegExp(`^Harga terakhir Rp[\\d.]+ pada \\d+ \\w+ 2026$`),
    );
  });

  it('menolak harga kosong tanpa memanggil API', async () => {
    const { user } = await renderInput();
    await user.click(screen.getByRole('button', { name: 'Simpan harga' }));
    expect(await screen.findByText(TEXT.inputInvalid)).toBeInTheDocument();
    expect(callsTo('addHargaBahan')).toHaveLength(0);
  });

  it('menolak harga nol tanpa memanggil API', async () => {
    const { user } = await renderInput();
    await user.type(screen.getByLabelText(/^Harga per/), '0');
    await user.click(screen.getByRole('button', { name: 'Simpan harga' }));
    expect(await screen.findByText(TEXT.inputInvalid)).toBeInTheDocument();
    expect(callsTo('addHargaBahan')).toHaveLength(0);
  });

  it('menolak tanggal kosong tanpa memanggil API', async () => {
    const { user } = await renderInput();
    await user.clear(screen.getByLabelText('Tanggal'));
    await user.type(screen.getByLabelText(/^Harga per/), '36000');
    await user.click(screen.getByRole('button', { name: 'Simpan harga' }));
    expect(await screen.findByText(TEXT.inputInvalid)).toBeInTheDocument();
    expect(callsTo('addHargaBahan')).toHaveLength(0);
  });

  it('menyimpan harga lalu memuat ulang tabel dan tanggal data di header', async () => {
    const { user } = await renderInput();
    expect(callsTo('getHargaTerbaru')).toHaveLength(1);
    expect(callsTo('getDashboard')).toHaveLength(1);

    // Server akan mengembalikan tanggal data baru setelah harga disimpan.
    const updated = structuredClone(dashboardFixture);
    updated.data.rekomendasi.tanggal_data = '2026-10-03';
    respondWith('getDashboard', () => HttpResponse.json(updated));

    await user.selectOptions(screen.getByLabelText('Bahan'), 'Telur ayam');
    await user.clear(screen.getByLabelText('Tanggal'));
    await user.type(screen.getByLabelText('Tanggal'), '2026-10-03');
    await user.type(screen.getByLabelText(/^Harga per/), '36000');
    await user.click(screen.getByRole('button', { name: 'Simpan harga' }));

    expect(await screen.findByText('Harga Telur ayam tanggal 3 Okt 2026 tersimpan: Rp36.000.')).toBeInTheDocument();
    const [request] = callsTo('addHargaBahan');
    expect(request?.method).toBe('POST');
    expect(request?.body).toMatchObject({
      action: 'addHargaBahan',
      payload: { tanggal: '2026-10-03', bahan: 'Telur ayam', harga: 36000 },
    });
    await waitFor(() => expect(callsTo('getHargaTerbaru')).toHaveLength(2));
    await waitFor(() => expect(callsTo('getDashboard')).toHaveLength(2));
    expect(await screen.findByText('Data per 3 Okt 2026')).toBeInTheDocument();
    expect(screen.getByLabelText(/^Harga per/)).toHaveValue(null);
  });

  it('menampilkan pesan server apa adanya saat penyimpanan ditolak', async () => {
    respondWith('addHargaBahan', () =>
      HttpResponse.json({ ok: false, error: 'Bahan "Telur" belum ada di sheet Harga.' }),
    );
    const { user } = await renderInput();
    await user.type(screen.getByLabelText(/^Harga per/), '1000');
    await user.click(screen.getByRole('button', { name: 'Simpan harga' }));
    expect(await screen.findByText('Bahan "Telur" belum ada di sheet Harga.')).toBeInTheDocument();
  });
});
