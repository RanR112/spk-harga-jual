import { describe, expect, it } from 'vitest';
import type { Pengaturan } from '@/api/types';
import { KEPUTUSAN_LABEL, KEPUTUSAN_ORDER, emptyFilterTitle, groupRule, hppDefinition, ruleSummary } from './text';

const pengaturan: Pengaturan = {
  batas_naik_persen: 10,
  batas_turun_persen: 12.5,
  margin_target_persen: 45,
  margin_minimum_persen: 35,
  pembulatan: 500,
  periode_moving_average_hari: 7,
};

describe('teks antarmuka yang disusun dari data', () => {
  it('aturan kelompok mengikuti pengaturan, bukan angka tetap', () => {
    expect(groupRule('NAIKKAN HARGA', pengaturan)).toBe('HPP naik ≥ 10,0% atau margin < 35,0%');
    expect(groupRule('BERI PROMO', pengaturan)).toBe('HPP turun ≥ 12,5%');
    expect(groupRule('PERTAHANKAN', pengaturan)).toBe('perubahan HPP masih dalam batas wajar');
    expect(groupRule('DATA TIDAK LENGKAP', pengaturan)).toBe('ada bahan yang belum punya harga');
  });

  it('ringkasan aturan memuat batas dan periode dari pengaturan', () => {
    expect(ruleSummary(pengaturan)).toBe(
      'Naik jika HPP naik ≥ 10,0% atau margin < 35,0%; promo jika HPP turun ≥ 12,5%. ' +
        'HPP memakai rata-rata 7 harga terakhir tiap bahan.',
    );
  });

  it('penjelasan HPP memakai periode dari API', () => {
    expect(hppDefinition(14)).toBe('HPP = biaya bahan per porsi, dirata-rata 14 hari.');
  });

  it('judul keadaan kosong memakai nama pendek keputusan', () => {
    expect(emptyFilterTitle('Promo')).toBe('Belum ada produk yang cocok untuk promo.');
  });

  it('keempat keputusan punya kunci, kata pendek, dan arti yang berbeda', () => {
    expect(KEPUTUSAN_ORDER).toHaveLength(4);
    const keys = KEPUTUSAN_ORDER.map((keputusan) => KEPUTUSAN_LABEL[keputusan].key);
    expect(new Set(keys).size).toBe(4);
    const caps = KEPUTUSAN_ORDER.map((keputusan) => KEPUTUSAN_LABEL[keputusan].cap);
    expect(caps).toEqual(['Naik', 'Promo', 'Tahan', 'Data']);
    const meanings = KEPUTUSAN_ORDER.map((keputusan) => KEPUTUSAN_LABEL[keputusan].meaning);
    expect(new Set(meanings).size).toBe(4);
  });
});
