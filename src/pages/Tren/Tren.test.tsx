import { screen, within } from '@testing-library/react';
import { HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import trenFixture from '@fixtures/getTrenData.json';
import { FORBIDDEN_TEXT, renderApp } from '@/test/render';
import { callsTo, respondWith } from '@/test/server';

interface MockDataset {
  label: string;
  data: (number | null)[];
}

// jsdom tidak punya canvas. Grafik diganti elemen yang mencatat dataset yang diterimanya.
vi.mock('react-chartjs-2', () => ({
  Line: ({ data, 'aria-label': label }: { data: { datasets: MockDataset[] }; 'aria-label': string }) => (
    <figure aria-label={label}>
      {data.datasets.map((dataset) => (
        <figcaption key={dataset.label} data-points={dataset.data.length} data-first={String(dataset.data[0])}>
          {dataset.label}
        </figcaption>
      ))}
    </figure>
  ),
}));

function chart(name: RegExp) {
  return screen.getByRole('figure', { name });
}

describe('Tren harga', () => {
  it('memanggil getTrenData dengan days=60', async () => {
    renderApp('/tren');
    await screen.findByRole('figure', { name: /Grafik HPP per porsi/ });
    expect(callsTo('getTrenData')[0]?.url.searchParams.get('days')).toBe('60');
  });

  it('grafik HPP punya empat garis dengan label ambang dari API', async () => {
    renderApp('/tren');
    const hpp = await screen.findByRole('figure', { name: /Grafik HPP per porsi Nasi Goreng Spesial/ });
    const labels = within(hpp)
      .getAllByText(/./)
      .map((element) => element.textContent);
    expect(labels).toEqual([
      'HPP (rata-rata 7 hari)',
      'HPP baseline',
      'Batas naik harga (+10,0%)',
      'Batas promo (-10,0%)',
    ]);
    expect(screen.getByText(/Jika HPP menembus batas naik/)).toBeInTheDocument();
  });

  it('label ambang mengikuti nilai dari API, bukan angka tetap', async () => {
    const data = structuredClone(trenFixture.data);
    data.batas_naik_persen = 12.5;
    data.batas_turun_persen = 8;
    respondWith('getTrenData', () => HttpResponse.json({ ok: true, data }));
    renderApp('/tren');
    const hpp = await screen.findByRole('figure', { name: /Grafik HPP per porsi/ });
    expect(within(hpp).getByText('Batas naik harga (+12,5%)')).toBeInTheDocument();
    expect(within(hpp).getByText('Batas promo (-8,0%)')).toBeInTheDocument();
  });

  it('mengganti produk dan bahan memperbarui grafik yang sama', async () => {
    const { user } = renderApp('/tren');
    await screen.findByRole('figure', { name: /Nasi Goreng Spesial/ });

    await user.selectOptions(screen.getByLabelText('Produk'), 'Ayam Geprek + Nasi');
    expect(chart(/Grafik HPP per porsi Ayam Geprek \+ Nasi/)).toBeInTheDocument();
    expect(screen.getAllByRole('figure', { name: /Grafik HPP per porsi/ })).toHaveLength(1);

    await user.selectOptions(screen.getByLabelText('Bahan'), 'Telur ayam');
    const bahan = chart(/Grafik harga Telur ayam/);
    expect(within(bahan).getByText('Telur ayam (per kg)')).toBeInTheDocument();
    expect(screen.getAllByRole('figure', { name: /Grafik harga / })).toHaveLength(1);
  });

  it('tidak menampilkan teks terlarang', async () => {
    renderApp('/tren');
    await screen.findByRole('figure', { name: /Grafik HPP per porsi/ });
    expect(document.body.textContent).not.toMatch(FORBIDDEN_TEXT);
  });

  it('menampilkan galat dengan tombol Coba lagi', async () => {
    respondWith('getTrenData', () => HttpResponse.text('<html>login</html>'));
    renderApp('/tren');
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Respons dari server bukan JSON');
    expect(within(alert).getByRole('button', { name: 'Coba lagi' })).toBeInTheDocument();
  });
});
