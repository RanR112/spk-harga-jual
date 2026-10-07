import dashboardFixture from '@fixtures/getDashboard.json';
import type { DashboardData, Rekomendasi } from '@/api/types';

export function dashboardData(): DashboardData {
  return structuredClone((dashboardFixture as unknown as { data: DashboardData }).data);
}

/**
 * Fixture tiruan untuk keputusan DATA TIDAK LENGKAP, yang tidak ada di docs/fixtures
 * karena data dummy lengkap (lihat docs/02 bagian Fixture).
 */
export const rekomendasiTidakLengkap: Rekomendasi = {
  id_produk: 'P10',
  nama_produk: 'Es Campur',
  harga_jual: 12000,
  hpp_baseline: 5000,
  hpp: null,
  perubahan_persen: null,
  margin_persen: null,
  margin_awal_persen: null,
  keputusan: 'DATA TIDAK LENGKAP',
  urgensi: '',
  harga_saran: null,
  kenaikan_rp: null,
  diskon_maks_persen: null,
  hemat_per_porsi: null,
  keterangan: 'Harga bahan "Susu kental manis" belum diisi.',
  rincian: [],
};

/** Dashboard fixture ditambah satu produk berstatus DATA TIDAK LENGKAP. */
export function dashboardWithIncomplete(): DashboardData {
  const data = dashboardData();
  data.rekomendasi.items.push(structuredClone(rekomendasiTidakLengkap));
  data.rekomendasi.ringkasan.total += 1;
  data.rekomendasi.ringkasan.data = 1;
  return data;
}
