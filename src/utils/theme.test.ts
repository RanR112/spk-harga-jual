import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getTheme, initTheme, isDarkTheme, otherTheme, setTheme } from './theme';

function root() {
  return document.documentElement;
}

function mockSystemDark(dark: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: dark && query.includes('dark'), media: query }));
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.localStorage.clear();
  initTheme();
});

describe('tema', () => {
  it('bergantian terang dan gelap', () => {
    expect(otherTheme('light')).toBe('dark');
    expect(otherTheme('dark')).toBe('light');
  });

  it('kunjungan pertama mengikuti tema sistem', () => {
    mockSystemDark(true);
    initTheme();
    expect(getTheme()).toBe('dark');
    expect(root()).toHaveAttribute('data-theme', 'dark');

    mockSystemDark(false);
    initTheme();
    expect(getTheme()).toBe('light');
    expect(root()).toHaveAttribute('data-theme', 'light');
  });

  it('terang bila sistem tidak menyediakan matchMedia', () => {
    vi.stubGlobal('matchMedia', undefined);
    initTheme();
    expect(getTheme()).toBe('light');
  });

  it('pilihan tersimpan mengalahkan tema sistem', () => {
    window.localStorage.setItem('spk-theme', 'light');
    mockSystemDark(true);
    initTheme();
    expect(getTheme()).toBe('light');
  });

  it('setTheme memasang atribut dan menyimpan pilihan', () => {
    initTheme();
    setTheme('dark');
    expect(root()).toHaveAttribute('data-theme', 'dark');
    expect(window.localStorage.getItem('spk-theme')).toBe('dark');
    expect(isDarkTheme()).toBe(true);

    setTheme('light');
    expect(root()).toHaveAttribute('data-theme', 'light');
    expect(isDarkTheme()).toBe(false);
  });

  it('mengabaikan nilai tersimpan yang tidak dikenal, termasuk "system" dari versi sebelumnya', () => {
    mockSystemDark(false);
    window.localStorage.setItem('spk-theme', 'system');
    initTheme();
    expect(getTheme()).toBe('light');
  });

  it('tetap berfungsi saat localStorage diblokir', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('diblokir');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('diblokir');
    });
    expect(() => initTheme()).not.toThrow();
    expect(() => setTheme('dark')).not.toThrow();
    expect(root()).toHaveAttribute('data-theme', 'dark');
  });
});
