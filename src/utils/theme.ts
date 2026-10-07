/**
 * Dua tema: terang dan gelap. Tema diterapkan lewat atribut `data-theme` pada <html>.
 * Pada kunjungan pertama (belum ada pilihan tersimpan) nilai awalnya mengikuti tema sistem;
 * setelah itu pilihan pengguna disimpan di localStorage dan tidak lagi mengikuti sistem.
 */
export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'spk-theme';
const DARK_QUERY = '(prefers-color-scheme: dark)';

const listeners = new Set<() => void>();
let current: Theme = 'light';

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark';
}

function systemTheme(): Theme {
  return typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

function readStored(): Theme | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return isTheme(value) ? value : null;
  } catch {
    // localStorage bisa diblokir (mode privat); tema tetap berfungsi tanpa penyimpanan.
    return null;
  }
}

function applyAttribute(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
}

/** Dipanggil sekali sebelum render pertama agar tema langsung terpasang tanpa kilatan. */
export function initTheme(): void {
  current = readStored() ?? systemTheme();
  applyAttribute(current);
}

export function getTheme(): Theme {
  return current;
}

export function setTheme(theme: Theme): void {
  current = theme;
  applyAttribute(theme);
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Diabaikan: pilihan tetap berlaku sampai halaman ditutup.
  }
  listeners.forEach((listener) => listener());
}

export function otherTheme(theme: Theme): Theme {
  return theme === 'dark' ? 'light' : 'dark';
}

export function isDarkTheme(): boolean {
  return current === 'dark';
}

export function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
