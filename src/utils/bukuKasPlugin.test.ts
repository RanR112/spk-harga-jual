import { describe, expect, it } from 'vitest';
import { spread } from './bukuKasPlugin';

describe('spread (penyebar label grafik)', () => {
  it('membiarkan label yang sudah berjauhan', () => {
    expect(spread([20, 80, 140], 0, 200)).toEqual([20, 80, 140]);
  });

  it('menggeser label yang bertumpuk ke bawah dengan jarak minimal 16px, urutan tetap', () => {
    const result = spread([100, 102, 104], 0, 300);
    expect(result).toEqual([100, 116, 132]);
  });

  it('mengembalikan posisi sesuai urutan masukan walau masukan tidak terurut', () => {
    const result = spread([140, 20, 80], 0, 200);
    expect(result).toEqual([140, 20, 80]);
  });

  it('menjaga label terbawah tetap di dalam batas bawah dan menaikkan yang di atasnya', () => {
    const result = spread([190, 195, 205], 0, 200);
    expect(Math.max(...result)).toBeLessThanOrEqual(200);
    const sorted = [...result].sort((a, b) => a - b);
    expect(sorted[1]! - sorted[0]!).toBeGreaterThanOrEqual(16);
    expect(sorted[2]! - sorted[1]!).toBeGreaterThanOrEqual(16);
  });

  it('menjaga label teratas tidak keluar dari batas atas', () => {
    expect(Math.min(...spread([-10, 5], 8, 200))).toBeGreaterThanOrEqual(8);
  });

  it('menerima daftar kosong', () => {
    expect(spread([], 0, 100)).toEqual([]);
  });
});
