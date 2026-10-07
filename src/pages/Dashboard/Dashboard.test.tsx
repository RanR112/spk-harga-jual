import { screen, waitFor, within } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { dashboardWithIncomplete } from '@/test/fixtures';
import { FORBIDDEN_TEXT, renderApp } from '@/test/render';
import { callsTo, resetOverrides, respondWith } from '@/test/server';

async function renderDashboard() {
  const view = renderApp('/');
  const table = await screen.findByRole('table', { name: 'Rekomendasi harga per produk' });
  return { ...view, table };
}

/** Baris produk saja: baris judul kelompok tidak punya tombol nama produk. */
function productRows(table: HTMLElement) {
  return within(table)
    .getAllByRole('row')
    .filter((row) => within(row).queryByRole('button') !== null);
}

/** Bagian-bagian baris ringkasan yang juga menjadi filter. */
const summary = {
  all: () => screen.getByRole('button', { name: /produk$/ }),
  naik: () => screen.getByRole('button', { name: /naik$/ }),
  promo: () => screen.getByRole('button', { name: /promo$/ }),
  tahan: () => screen.getByRole('button', { name: /tahan$/ }),
  data: () => screen.getByRole('button', { name: /data belum lengkap$/ }),
};

describe('Dashboard', () => {
  it('menampilkan keadaan memuat lebih dulu', () => {
    renderApp('/');
    expect(screen.getByRole('status')).toHaveTextContent('Memuat rekomendasi...');
    expect(screen.getByText('Memuat data...')).toBeInTheDocument();
  });

  it('memanggil getDashboard tepat satu kali', async () => {
    await renderDashboard();
    expect(callsTo('getDashboard')).toHaveLength(1);
    expect(callsTo('getDashboard')[0]?.method).toBe('GET');
  });

  it('menampilkan angka ringkasan 9 / 4 / 2 / 3 dalam satu baris', async () => {
    await renderDashboard();
    expect(summary.all()).toHaveTextContent('9 produk');
    expect(summary.naik()).toHaveTextContent('4 naik');
    expect(summary.promo()).toHaveTextContent('2 promo');
    expect(summary.tahan()).toHaveTextContent('3 tahan');
    expect(screen.queryByRole('button', { name: /data belum lengkap/ })).not.toBeInTheDocument();
  });

  it('menampilkan tanggal data di header', async () => {
    await renderDashboard();
    expect(screen.getByText('Data per 2 Okt 2026')).toBeInTheDocument();
  });

  it('menampilkan 9 baris dengan baris pertama Ayam Geprek + Nasi', async () => {
    const { table } = await renderDashboard();
    const rows = productRows(table);
    expect(rows).toHaveLength(9);
    const first = rows[0] as HTMLElement;
    expect(within(first).getByRole('button', { name: 'Ayam Geprek + Nasi' })).toBeInTheDocument();
    expect(first).toHaveTextContent('Rp22.000');
    expect(first).toHaveTextContent('Rp26.500');
    expect(first).toHaveTextContent('+Rp4.500');
    expect(first).toHaveTextContent('Naikkan harga');
    expect(first).toHaveTextContent('Urgensi tinggi');
  });

  it('memakai lima kolom dan menaruh HPP, perubahan, dan margin di dialog rincian', async () => {
    const { table } = await renderDashboard();
    const headers = within(table)
      .getAllByRole('columnheader')
      .map((header) => header.textContent);
    expect(headers).toEqual(['Produk', 'Harga sekarang', 'Harga saran', 'Selisih', 'Keputusan']);
    expect(table).not.toHaveTextContent('Rp14.302');
  });

  it('mengelompokkan baris menurut keputusan dengan aturan dari pengaturan', async () => {
    const { table } = await renderDashboard();
    const groups = within(table).getAllByRole('rowheader');
    expect(groups).toHaveLength(3);
    expect(groups[0]).toHaveTextContent('Naikkan harga · 4');
    expect(groups[0]).toHaveTextContent('HPP naik ≥ 10,0% atau margin < 35,0%');
    expect(groups[1]).toHaveTextContent('Beri promo · 2');
    expect(groups[1]).toHaveTextContent('HPP turun ≥ 10,0%');
    expect(groups[2]).toHaveTextContent('Pertahankan · 3');
  });

  it('menampilkan isi kolom harga saran sesuai keputusan', async () => {
    const { table } = await renderDashboard();
    const rows = productRows(table);
    const byDecision = (text: string) => rows.filter((row) => row.textContent?.includes(text));

    const naik = byDecision('(Naikkan harga)');
    expect(naik).toHaveLength(4);
    naik.forEach((row) => expect(row.textContent).toMatch(/Rp\d+\.\d{3}\+Rp[\d.]+/));

    const promo = byDecision('(Beri promo)');
    expect(promo).toHaveLength(2);
    promo.forEach((row) => {
      expect(row).toHaveTextContent(/harga tetap/);
      expect(row).toHaveTextContent(/diskon aman maks \d+,\d%/);
      expect(row).toHaveTextContent(/hemat Rp[\d.]+ per porsi/);
    });

    const tahan = byDecision('(Pertahankan)');
    expect(tahan).toHaveLength(3);
    tahan.forEach((row) => expect(row).toHaveTextContent('harga tetap'));
  });

  it('memfilter tabel saat bagian promo di baris ringkasan diklik, dan kembali saat diklik lagi', async () => {
    const { user, table } = await renderDashboard();
    expect(summary.all()).toHaveAttribute('aria-pressed', 'true');
    expect(summary.promo()).toHaveAttribute('aria-pressed', 'false');

    await user.click(summary.promo());

    expect(summary.promo()).toHaveAttribute('aria-pressed', 'true');
    expect(summary.all()).toHaveAttribute('aria-pressed', 'false');
    const rows = productRows(table);
    expect(rows).toHaveLength(2);
    rows.forEach((row) => expect(row).toHaveTextContent('Beri promo'));
    expect(within(table).getAllByRole('rowheader')).toHaveLength(1);

    await user.click(summary.promo());
    expect(productRows(table)).toHaveLength(9);

    await user.click(summary.tahan());
    expect(productRows(table)).toHaveLength(3);
    await user.click(summary.all());
    expect(productRows(table)).toHaveLength(9);
  });

  it('menyusun ringkasan aturan dari pengaturan', async () => {
    await renderDashboard();
    expect(screen.getByText('Aturan yang berlaku.')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Naik jika HPP naik ≥ 10,0% atau margin < 35,0%; promo jika HPP turun ≥ 10,0%. ' +
          'HPP memakai rata-rata 7 harga terakhir tiap bahan.',
      ),
    ).toBeInTheDocument();
  });

  it('menampilkan enam bahan yang paling bergerak', async () => {
    await renderDashboard();
    const panel = screen.getByRole('region', { name: 'Bahan yang paling bergerak' });
    const [, body] = within(panel).getAllByRole('rowgroup');
    expect(within(body as HTMLElement).getAllByRole('row')).toHaveLength(6);
    expect(within(panel).getByText('Dibanding 7 data sebelumnya.')).toBeInTheDocument();
  });

  it('menjelaskan arti keempat cap keputusan', async () => {
    await renderDashboard();
    const legend = screen.getByRole('region', { name: 'Cara membaca cap' });
    expect(within(legend).getAllByRole('listitem')).toHaveLength(4);
    expect(legend).toHaveTextContent('Biaya bahan naik, sebaiknya harga jual dinaikkan.');
  });

  it('membuka dialog rincian dan menutupnya dengan Esc, tombol Tutup, dan klik latar', async () => {
    const { user } = await renderDashboard();
    const trigger = screen.getByRole('button', { name: 'Ayam Geprek + Nasi' });

    await user.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Ayam Geprek + Nasi' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveFocus();
    expect(within(dialog).getByText(/^Naikkan harga karena HPP naik 13,8%/)).toBeInTheDocument();
    const rincian = within(dialog).getByRole('table', { name: 'Rincian bahan Ayam Geprek + Nasi' });
    expect(within(rincian).getByText('Daging ayam')).toBeInTheDocument();
    expect(within(rincian).getByRole('rowheader', { name: 'HPP sekarang' })).toBeInTheDocument();
    expect(within(rincian).getAllByText('Rp14.302').length).toBeGreaterThan(0);
    expect(dialog).toHaveTextContent('HPP baselineRp12.564');
    expect(dialog).toHaveTextContent('HPP sekarangRp14.302');
    expect(dialog).toHaveTextContent('Perubahan HPP+13,8%');
    expect(dialog).toHaveTextContent('Margin awal → sekarang42,9% → 35,0%');
    expect(dialog).toHaveTextContent('Harga saranRp26.500');

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();

    await user.click(trigger);
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Tutup' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await user.click(trigger);
    const overlay = screen.getByRole('dialog').parentElement as HTMLElement;
    await user.click(overlay);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('membuka dialog juga saat bagian lain dari baris diklik', async () => {
    const { user, table } = await renderDashboard();
    const row = productRows(table)[0] as HTMLElement;
    await user.click(within(row).getByText('Rp22.000'));
    expect(screen.getByRole('dialog', { name: 'Ayam Geprek + Nasi' })).toBeInTheDocument();
  });

  it('menampilkan diskon dan penghematan promo di dialog produk promo', async () => {
    const { user } = await renderDashboard();
    await user.click(screen.getByRole('button', { name: 'Pisang Goreng (5 pcs)' }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('Diskon aman maks24,3%');
    expect(dialog).toHaveTextContent('Hemat per porsiRp913');
    expect(dialog).toHaveTextContent('Perubahan HPP-15,7%');
  });

  it('menahan fokus di dalam dialog', async () => {
    const { user } = await renderDashboard();
    await user.click(screen.getByRole('button', { name: 'Ayam Geprek + Nasi' }));
    const dialog = screen.getByRole('dialog');
    for (let i = 0; i < 6; i += 1) {
      await user.tab();
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }
  });

  it('menyimpan ke riwayat dan menampilkan jumlah tersimpan dan terlewati', async () => {
    const { user } = await renderDashboard();
    const button = screen.getByRole('button', { name: 'Simpan ke riwayat' });
    await user.click(button);
    expect(await screen.findByText(/9 keputusan disimpan, 0 dilewati/)).toBeInTheDocument();
    expect(callsTo('simpanKeRiwayat')).toHaveLength(1);
    expect(callsTo('simpanKeRiwayat')[0]?.method).toBe('POST');
  });

  it('menangani keputusan DATA TIDAK LENGKAP dengan angka null', async () => {
    respondWith('getDashboard', () => HttpResponse.json({ ok: true, data: dashboardWithIncomplete() }));
    const { user, table } = await renderDashboard();

    const dataFilter = summary.data();
    expect(dataFilter).toHaveTextContent('1 data belum lengkap');
    await user.click(dataFilter);

    const rows = productRows(table);
    expect(rows).toHaveLength(1);
    const row = rows[0] as HTMLElement;
    expect(row).toHaveTextContent('Es Campur');
    expect(row).toHaveTextContent('Data belum lengkap');
    expect(row).toHaveTextContent('Harga bahan "Susu kental manis" belum diisi.');

    await user.click(within(row).getByRole('button', { name: 'Es Campur' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Rincian bahan belum tersedia');
    expect(document.body.textContent).not.toMatch(FORBIDDEN_TEXT);
  });

  it('menampilkan keadaan kosong dengan tombol "Tampilkan semua produk" saat filter tidak punya hasil', async () => {
    const data = dashboardWithIncomplete();
    data.rekomendasi.items = data.rekomendasi.items.filter((item) => item.keputusan !== 'BERI PROMO');
    respondWith('getDashboard', () => HttpResponse.json({ ok: true, data }));
    const { user, table } = await renderDashboard();

    await user.click(summary.promo());
    expect(screen.queryByRole('table', { name: 'Rekomendasi harga per produk' })).not.toBeInTheDocument();
    expect(screen.getByText('Tidak ada produk dengan keputusan ini.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Tampilkan semua produk' }));
    expect(await screen.findByRole('table', { name: 'Rekomendasi harga per produk' })).toBeInTheDocument();
    expect(table).not.toBeInTheDocument();
  });

  it('tidak menampilkan NaN, undefined, null, atau [object Object]', async () => {
    await renderDashboard();
    expect(document.body.textContent).not.toMatch(FORBIDDEN_TEXT);
  });

  it('menampilkan galat di dalam konten dengan tombol Coba lagi', async () => {
    respondWith('getDashboard', () => HttpResponse.json({ ok: false, error: 'Sheet "Produk" tidak ditemukan.' }));
    const { user } = renderApp('/');

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Sheet "Produk" tidak ditemukan.');

    resetOverrides();
    await user.click(within(alert).getByRole('button', { name: 'Coba lagi' }));
    await screen.findByRole('table', { name: 'Rekomendasi harga per produk' });
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });
});
