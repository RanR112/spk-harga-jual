// Disalin apa adanya dari docs/02-kontrak-api.md. Nama field mengikuti API, jangan di-camelCase-kan.

export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type Keputusan =
  | 'NAIKKAN HARGA'
  | 'BERI PROMO'
  | 'PERTAHANKAN'
  | 'DATA TIDAK LENGKAP';

export type Urgensi = '' | 'Rendah' | 'Sedang' | 'Tinggi';

export interface Pengaturan {
  batas_naik_persen: number;
  batas_turun_persen: number;
  margin_target_persen: number;
  margin_minimum_persen: number;
  pembulatan: number;
  periode_moving_average_hari: number;
}

/** Satu baris rincian bahan penyusun HPP sebuah produk. */
export interface RincianBahan {
  bahan: string;
  satuan: string;
  takaran: number;
  harga_rata2: number;
  biaya: number;
  porsi_persen: number;   // kontribusi bahan ini terhadap HPP, 0..100
}

export interface Rekomendasi {
  id_produk: string;
  nama_produk: string;
  harga_jual: number;
  hpp_baseline: number;
  hpp: number | null;
  perubahan_persen: number | null;      // persen, 13.8 berarti +13,8%
  margin_persen: number | null;
  margin_awal_persen: number | null;
  keputusan: Keputusan;
  urgensi: Urgensi;                     // hanya terisi saat NAIKKAN HARGA
  harga_saran: number | null;           // hanya saat NAIKKAN HARGA
  kenaikan_rp: number | null;           // hanya saat NAIKKAN HARGA
  diskon_maks_persen: number | null;    // hanya saat BERI PROMO
  hemat_per_porsi: number | null;       // hanya saat BERI PROMO
  keterangan: string;                   // kalimat penjelas siap tampil
  rincian: RincianBahan[];              // kosong saat DATA TIDAK LENGKAP
}

export interface Ringkasan {
  total: number;
  naik: number;
  promo: number;
  tahan: number;
  data: number;        // jumlah produk berstatus DATA TIDAK LENGKAP
}

export interface RekomendasiResult {
  tanggal_data: string;       // 'YYYY-MM-DD', tanggal harga bahan terbaru
  pengaturan: Pengaturan;
  ringkasan: Ringkasan;
  items: Rekomendasi[];       // sudah terurut: naik, promo, tahan, data
}

export interface BahanInfo {
  nama: string;
  satuan: string;
  harga_terakhir: number;
  tanggal_terakhir: string;
  pembanding_tanggal: string;
  perubahan_persen: number;
}

export interface DashboardData {
  rekomendasi: RekomendasiResult;
  bahan: BahanInfo[];
}

export interface TrenProduk {
  id_produk: string;
  nama_produk: string;
  harga_jual: number;
  hpp_baseline: number;
}

export interface TrenData {
  dates: string[];                                              // sumbu X
  bahan: Record<string, { satuan: string; values: (number | null)[] }>;
  produk: TrenProduk[];
  hpp: Record<string, (number | null)[]>;                        // kunci = id_produk
  periode_ma: number;
  batas_naik_persen: number;
  batas_turun_persen: number;
}

export interface InputHarga {
  tanggal: string;
  bahan: string;
  satuan: string;
  harga: number;
  urut: number;
}

export interface RiwayatRow {
  tanggal: string;
  id_produk: string;
  nama_produk: string;
  hpp: number | null;
  perubahan_hpp_persen: number | null;
  margin_persen: number | null;
  keputusan: Keputusan;
  harga_saran: number | null;
  keterangan: string;
  urut: number;
}

export interface PingResult {
  status: string;
  waktu: string;      // ISO timestamp
}

export interface AddHargaResult {
  status: string;     // 'ok'
  tanggal: string;
  bahan: string;
  harga: number;
}

export interface SimpanRiwayatResult {
  tanggal: string;
  disimpan: number;   // jumlah keputusan yang baru ditulis
  dilewati: number;   // sudah ada untuk tanggal itu, tidak digandakan
}

// ---------- Payload permintaan (tambahan frontend, mengikuti docs/02 bagian daftar endpoint) ----------

export interface AddHargaPayload {
  tanggal: string;
  bahan: string;
  harga: number;
}
