import { screen, within } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import riwayatFixture from '@fixtures/getRiwayat.json';
import { TEXT } from '@/constants/text';
import { FORBIDDEN_TEXT, renderApp } from '@/test/render';
import { callsTo, respondWith } from '@/test/server';

async function renderRiwayat() {
  const view = renderApp('/riwayat');
  const table = await screen.findByRole('table', { name: 'Riwayat keputusan harga' });
  const [, body] = within(table).getAllByRole('rowgroup');
  const rows = () => within(body as HTMLElement).getAllByRole('row');
  return { ...view, table, rows };
}

describe('Riwayat', () => {
  it('memanggil getRiwayat dengan limit=300', async () => {
    await renderRiwayat();
    expect(callsTo('getRiwayat')[0]?.url.searchParams.get('limit')).toBe('300');
  });

  it('menampilkan 36 baris dari 4 tanggal, terbaru di atas', async () => {
    const { rows } = await renderRiwayat();
    expect(rows()).toHaveLength(36);
    expect(screen.getByText('Menampilkan 36 baris dari 4 tanggal.')).toBeInTheDocument();
    const dates = rows().map((row) => row.querySelector('td')?.textContent);
    expect(dates[0]).toBe('2 Okt 2026');
    expect(dates[dates.length - 1]).not.toBe('2 Okt 2026');
  });

  it('mengurutkan terbaru di atas walau API mengirim urutan lama', async () => {
    const reversed = { ok: true, data: [...riwayatFixture.data].reverse() };
    respondWith('getRiwayat', () => HttpResponse.json(reversed));
    const { rows } = await renderRiwayat();
    expect(rows()[0]?.querySelector('td')?.textContent).toBe('2 Okt 2026');
  });

  it('menampilkan nilai null sebagai "-"', async () => {
    const data = structuredClone(riwayatFixture.data) as Record<string, unknown>[];
    Object.assign(data[0] as object, { hpp: null, perubahan_hpp_persen: null, margin_persen: null, harga_saran: null });
    respondWith('getRiwayat', () => HttpResponse.json({ ok: true, data }));
    const { rows } = await renderRiwayat();
    const cells = within(rows()[0] as HTMLElement).getAllByRole('cell');
    expect(cells[2]).toHaveTextContent(/^-$/);
    expect(cells[3]).toHaveTextContent(/^-$/);
    expect(cells[4]).toHaveTextContent(/^-$/);
    expect(cells[6]).toHaveTextContent(/^-$/);
    expect(document.body.textContent).not.toMatch(FORBIDDEN_TEXT);
  });

  it('bisa difilter berdasarkan keputusan', async () => {
    const { user, rows } = await renderRiwayat();
    await user.selectOptions(screen.getByLabelText('Keputusan'), 'BERI PROMO');
    rows().forEach((row) => expect(row).toHaveTextContent('Beri promo'));
  });

  it('menampilkan kalimat ramah saat riwayat kosong', async () => {
    respondWith('getRiwayat', () => HttpResponse.json({ ok: true, data: [] }));
    renderApp('/riwayat');
    expect(await screen.findByText(TEXT.emptyRiwayat)).toBeInTheDocument();
  });

  it('menampilkan galat jaringan dengan tombol Coba lagi', async () => {
    respondWith('getRiwayat', () => HttpResponse.error());
    renderApp('/riwayat');
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Tidak dapat terhubung ke server');
    expect(within(alert).getByRole('button', { name: 'Coba lagi' })).toBeInTheDocument();
  });
});
