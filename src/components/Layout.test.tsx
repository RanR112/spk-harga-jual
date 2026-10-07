import { screen, waitFor, within } from '@testing-library/react';
import { delay, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import dashboardFixture from '@fixtures/getDashboard.json';
import { renderApp } from '@/test/render';
import { callsTo, respondWith } from '@/test/server';

describe('Layout dan navigasi', () => {
  it('menampilkan header dengan judul dan lima tab', async () => {
    renderApp('/');
    expect(screen.getByRole('heading', { level: 1, name: 'SPK Harga Jual' })).toBeInTheDocument();
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      'Dashboard',
      'Tren harga',
      'Input harga',
      'Pengaturan',
      'Riwayat',
    ]);
    expect(screen.getByRole('tab', { name: 'Dashboard' })).toHaveAttribute('aria-selected', 'true');
    await screen.findByText('Data per 2 Okt 2026');
  });

  it('berpindah tab dengan klik dan menandai tab aktif', async () => {
    const { user } = renderApp('/');
    await user.click(screen.getByRole('tab', { name: 'Riwayat' }));
    expect(screen.getByRole('tab', { name: 'Riwayat' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Dashboard' })).toHaveAttribute('aria-selected', 'false');
    expect(await screen.findByRole('table', { name: 'Riwayat keputusan harga' })).toBeInTheDocument();
  });

  it('tab bisa dioperasikan dengan keyboard', async () => {
    const { user } = renderApp('/');
    screen.getByRole('tab', { name: 'Dashboard' }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Tren harga' })).toHaveFocus();
    await user.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Riwayat' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('tab', { name: 'Riwayat' })).toHaveAttribute('aria-selected', 'true');
  });

  it('tombol Muat ulang memuat ulang data dan dinonaktifkan selama memuat', async () => {
    const { user } = renderApp('/');
    const button = screen.getByRole('button', { name: 'Muat ulang' });
    expect(button).toBeDisabled();
    await screen.findByText('Data per 2 Okt 2026');
    expect(button).toBeEnabled();

    respondWith('getDashboard', async () => {
      await delay(100);
      return HttpResponse.json(dashboardFixture);
    });
    await user.click(button);
    expect(button).toBeDisabled();
    await waitFor(() => expect(callsTo('getDashboard')).toHaveLength(2));
    await waitFor(() => expect(button).toBeEnabled());
  });

  it('tombol ganti tema ada di dalam header, di sebelah kanan tombol Muat ulang', () => {
    renderApp('/');
    const header = screen.getByRole('banner');
    const reload = within(header).getByRole('button', { name: 'Muat ulang' });
    const toggle = within(header).getByRole('button', { name: /Ganti ke tema/ });
    // DOM_POSITION_FOLLOWING: tombol tema berada setelah tombol Muat ulang dalam urutan dokumen.
    expect(reload.compareDocumentPosition(toggle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('menu tab berada di dalam header', () => {
    renderApp('/');
    expect(within(screen.getByRole('banner')).getAllByRole('tab')).toHaveLength(5);
  });

  it('wadah notifikasi memakai aria-live polite', () => {
    const { container } = renderApp('/');
    expect(container.querySelector('[aria-live="polite"]')).not.toBeNull();
  });
});
