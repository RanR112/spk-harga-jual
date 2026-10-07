import { describe, expect, it } from 'vitest';
import { EMPTY, formatDate, formatDateShort, formatNumber, formatPercent, formatRupiah, todayIso } from './format';

describe('formatRupiah', () => {
  it('memakai titik ribuan tanpa spasi setelah Rp', () => {
    expect(formatRupiah(14302)).toBe('Rp14.302');
    expect(formatRupiah(1250000)).toBe('Rp1.250.000');
    expect(formatRupiah(0)).toBe('Rp0');
  });

  it('memberi tanda saat diminta', () => {
    expect(formatRupiah(4500, { signed: true })).toBe('+Rp4.500');
    expect(formatRupiah(-913, { signed: true })).toBe('-Rp913');
    expect(formatRupiah(-913)).toBe('-Rp913');
  });

  it('membulatkan ke rupiah utuh', () => {
    expect(formatRupiah(912.6)).toBe('Rp913');
  });

  it('mengembalikan "-" untuk null, undefined, dan NaN', () => {
    expect(formatRupiah(null)).toBe(EMPTY);
    expect(formatRupiah(undefined)).toBe(EMPTY);
    expect(formatRupiah(Number.NaN)).toBe(EMPTY);
    expect(formatRupiah(Number.POSITIVE_INFINITY)).toBe(EMPTY);
  });
});

describe('formatPercent', () => {
  it('memakai koma desimal dan satu angka di belakang koma', () => {
    expect(formatPercent(13.8)).toBe('13,8%');
    expect(formatPercent(35)).toBe('35,0%');
    expect(formatPercent(24.31)).toBe('24,3%');
  });

  it('memberi tanda + dan - saat signed', () => {
    expect(formatPercent(13.8, { signed: true })).toBe('+13,8%');
    expect(formatPercent(-15.7, { signed: true })).toBe('-15,7%');
    expect(formatPercent(0, { signed: true })).toBe('0,0%');
    expect(formatPercent(-0.01, { signed: true })).toBe('0,0%');
  });

  it('mengembalikan "-" untuk null', () => {
    expect(formatPercent(null)).toBe(EMPTY);
    expect(formatPercent(null, { signed: true })).toBe(EMPTY);
    expect(formatPercent(Number.NaN)).toBe(EMPTY);
  });
});

describe('formatNumber', () => {
  it('memakai koma desimal', () => {
    expect(formatNumber(0.15)).toBe('0,15');
    expect(formatNumber(1500)).toBe('1.500');
    expect(formatNumber(null)).toBe(EMPTY);
  });
});

describe('formatDate', () => {
  it('mengubah ISO menjadi "2 Okt 2026"', () => {
    expect(formatDate('2026-10-02')).toBe('2 Okt 2026');
    expect(formatDate('2026-08-17')).toBe('17 Agu 2026');
    expect(formatDate('2026-05-01T10:00:00.000Z')).toBe('1 Mei 2026');
  });

  it('format pendek untuk sumbu grafik', () => {
    expect(formatDateShort('2026-09-03')).toBe('3 Sep');
  });

  it('mengembalikan "-" untuk null dan teks yang bukan tanggal', () => {
    expect(formatDate(null)).toBe(EMPTY);
    expect(formatDate(undefined)).toBe(EMPTY);
    expect(formatDate('')).toBe(EMPTY);
    expect(formatDate('kemarin')).toBe(EMPTY);
    expect(formatDate('2026-13-01')).toBe(EMPTY);
    expect(formatDateShort(null)).toBe(EMPTY);
  });
});

describe('todayIso', () => {
  it('memakai tanggal lokal', () => {
    expect(todayIso(new Date(2026, 9, 3, 23, 30))).toBe('2026-10-03');
  });
});
