import type { Keputusan, Pengaturan } from '@/api/types';
import { formatPercent } from '@/utils/format';

/** Teks antarmuka yang panjang atau dipakai di lebih dari satu tempat. */
export const TEXT = {
  appTitle: 'SPK Harga Jual',
  appSubtitle: 'Rekomendasi harga berdasarkan perubahan harga bahan pokok (HPP)',
  loadingData: 'Memuat data...',
  loading: 'Memuat...',
  retry: 'Coba lagi',
  reload: 'Muat ulang',
  demoBanner: 'Mode demo, data contoh.',
  demoBannerDetail:
    'URL API belum diisi, jadi aplikasi memakai data dari docs/fixtures dan perubahan hanya disimpan sementara. ' +
    'Salin .env.example menjadi .env lalu isi VITE_API_URL untuk memakai data asli.',

  movingNote: 'Dibanding 7 data sebelumnya.',
  hppExplain: 'HPP = biaya bahan per porsi.',
  rowHint: 'Ketuk atau klik baris untuk melihat rincian.',
  priceFlowHint: 'Harga sekarang → harga saran',
  noPriceChange: 'tidak ada perubahan harga',
  movingTitle: 'Bahan yang paling bergerak',
  legendTitle: 'Cara membaca cap',
  legendIntro:
    'HPP = biaya bahan per porsi. Sistem membandingkannya dengan HPP baseline, yaitu biaya saat harga jual terakhir ditetapkan.',
  ruleLabel: 'Aturan yang berlaku.',
  errorTitle: 'Data belum bisa dimuat.',
  showAll: 'Tampilkan semua produk',
  trenHppNote:
    'Jika HPP menembus batas naik, sistem menyarankan naik harga. Jika turun melewati batas promo, sistem menyarankan promo. ' +
    'Garis harga jual sengaja tidak ditampilkan karena nilainya jauh di atas HPP.',
  trenBahanNote: 'Garis putus-putus menunjukkan harga di awal periode sebagai pembanding.',
  zoneLabel: 'zona wajar',
  inputUpsertNote: 'Jika tanggal dan bahan sudah ada, harganya diperbarui.',
  inputInvalid: 'Lengkapi tanggal, bahan, dan harga. Harga harus lebih dari 0.',
  pengaturanInvalid: 'Semua field harus diisi dengan angka.',
  pengaturanSaved: 'Pengaturan tersimpan. Rekomendasi di dashboard sudah diperbarui.',

  emptyRekomendasi: 'Belum ada produk untuk dihitung. Isi sheet Produk dan Resep terlebih dahulu.',
  emptyFiltered: 'Tidak ada produk dengan keputusan ini.',
  emptyBahan: 'Belum ada data harga bahan.',
  emptyRincian: 'Rincian bahan belum tersedia karena resep atau harga bahan belum lengkap.',
  emptyTrenProduk: 'Belum ada data produk untuk digambar.',
  emptyHargaInput: 'Belum ada harga bahan yang diinput.',
  emptyRiwayat: 'Belum ada riwayat keputusan. Tekan "Simpan ke riwayat" di Dashboard untuk menyimpan keputusan hari ini.',
  emptyRiwayatFiltered: 'Tidak ada riwayat yang cocok dengan filter.',
} as const;

/** Judul keadaan kosong saat filter keputusan tidak punya hasil, misalnya "Belum ada produk yang cocok untuk promo." */
export function emptyFilterTitle(cap: string): string {
  return `Belum ada produk yang cocok untuk ${cap.toLowerCase()}.`;
}

/** Penjelasan HPP di bawah grafik tren, dengan periode rata-rata dari API. */
export function hppDefinition(periodeHari: number): string {
  return `HPP = biaya bahan per porsi, dirata-rata ${periodeHari} hari.`;
}

export type KeputusanKey = 'naik' | 'promo' | 'tahan' | 'data';

export interface KeputusanStyle {
  key: KeputusanKey;
  /** Nama lengkap, dipakai di judul kelompok, filter, dan teks pembaca layar. */
  label: string;
  /** Teks pendek di dalam cap. */
  cap: string;
  /** Arti keputusan untuk bagian "Cara membaca cap". */
  meaning: string;
}

export const KEPUTUSAN_LABEL: Record<Keputusan, KeputusanStyle> = {
  'NAIKKAN HARGA': {
    key: 'naik',
    label: 'Naikkan harga',
    cap: 'Naik',
    meaning: 'Biaya bahan naik, sebaiknya harga jual dinaikkan.',
  },
  'BERI PROMO': {
    key: 'promo',
    label: 'Beri promo',
    cap: 'Promo',
    meaning: 'Biaya bahan turun, ada ruang untuk diskon.',
  },
  PERTAHANKAN: {
    key: 'tahan',
    label: 'Pertahankan',
    cap: 'Tahan',
    meaning: 'Perubahan kecil, harga dipertahankan.',
  },
  'DATA TIDAK LENGKAP': {
    key: 'data',
    label: 'Data belum lengkap',
    cap: 'Data',
    meaning: 'Harga bahan belum lengkap, belum bisa dihitung.',
  },
};

/** Urutan kelompok di tabel, sama dengan urutan dari API: naik, promo, tahan, data. */
export const KEPUTUSAN_ORDER: Keputusan[] = ['NAIKKAN HARGA', 'BERI PROMO', 'PERTAHANKAN', 'DATA TIDAK LENGKAP'];

/** Aturan singkat tiap kelompok, disusun dari nilai pengaturan yang berlaku. */
export function groupRule(keputusan: Keputusan, pengaturan: Pengaturan): string {
  switch (keputusan) {
    case 'NAIKKAN HARGA':
      return (
        `HPP naik ≥ ${formatPercent(pengaturan.batas_naik_persen)} ` +
        `atau margin < ${formatPercent(pengaturan.margin_minimum_persen)}`
      );
    case 'BERI PROMO':
      return `HPP turun ≥ ${formatPercent(pengaturan.batas_turun_persen)}`;
    case 'PERTAHANKAN':
      return 'perubahan HPP masih dalam batas wajar';
    default:
      return 'ada bahan yang belum punya harga';
  }
}

/** Kalimat aturan di bawah tabel rekomendasi (setelah label "Aturan yang berlaku."), dari nilai pengaturan. */
export function ruleSummary(pengaturan: Pengaturan): string {
  return (
    `Naik jika HPP naik ≥ ${formatPercent(pengaturan.batas_naik_persen)} ` +
    `atau margin < ${formatPercent(pengaturan.margin_minimum_persen)}; ` +
    `promo jika HPP turun ≥ ${formatPercent(pengaturan.batas_turun_persen)}. ` +
    `HPP memakai rata-rata ${pengaturan.periode_moving_average_hari} harga terakhir tiap bahan.`
  );
}

export function simpanRiwayatMessage(tanggal: string, disimpan: number, dilewati: number): string {
  return `Riwayat ${tanggal}: ${disimpan} keputusan disimpan, ${dilewati} dilewati karena sudah tersimpan sebelumnya.`;
}
