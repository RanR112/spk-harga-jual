import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { renderApp } from '@/test/render';
import { initTheme, setTheme } from '@/utils/theme';

beforeEach(() => {
  window.localStorage.clear();
  setTheme('light');
});

afterEach(() => {
  window.localStorage.clear();
  initTheme();
});

describe('ThemeToggle', () => {
  it('bergantian terang dan gelap, memasang data-theme, dan menyimpan pilihan', async () => {
    const { user } = renderApp('/');
    const root = document.documentElement;
    expect(root).toHaveAttribute('data-theme', 'light');

    await user.click(screen.getByRole('button', { name: 'Ganti ke tema gelap' }));
    expect(root).toHaveAttribute('data-theme', 'dark');
    expect(window.localStorage.getItem('spk-theme')).toBe('dark');

    await user.click(screen.getByRole('button', { name: 'Ganti ke tema terang' }));
    expect(root).toHaveAttribute('data-theme', 'light');
    expect(window.localStorage.getItem('spk-theme')).toBe('light');
  });

  it('bisa dioperasikan dengan keyboard', async () => {
    const { user } = renderApp('/');
    screen.getByRole('button', { name: 'Ganti ke tema gelap' }).focus();
    await user.keyboard('{Enter}');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });
});
