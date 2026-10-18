// Disalin apa adanya dari docs/02-kontrak-api.md. Nama field mengikuti API, jangan di-camelCase-kan.

export type ApiResponse<T> =
    | { ok: true; data: T }
    | { ok: false; error: string };

export type Keputusan =
    | "NAIKKAN HARGA"
    | "BERI PROMO"
    | "PERTAHANKAN"
    | "DATA TIDAK LENGKAP";

export type Urgensi = "" | "Rendah" | "Sedang" | "Tinggi";

export interface Pengaturan {
    batas_naik_persen: number;
    batas_turun_persen: number;
    margin_target_persen: number;
    margin_minimum_persen: number;
    pembulatan: number;
    periode_moving_average_hari: number;
    // Tambahan SAW/AHP. Opsional supaya backend dan fixture lama (tanpa field ini) tetap valid.
    /** Bobot manual kriteria SAW (total 1). Dipakai bila AHP dimatikan atau matriksnya tidak konsisten. */
    bobot_perubahan_hpp?: number;
    bobot_margin?: number;
    bobot_selisih_margin?: number;
    bobot_porsi_bahan?: number;
    /** 1 = bobot SAW dari AHP, 0 = bobot manual. */
    gunakan_ahp?: number;
}

/** Satu baris rincian bahan penyusun HPP sebuah produk. */
export interface RincianBahan {
    bahan: string;
    satuan: string;
    takaran: number;
    harga_rata2: number;
    biaya: number;
    porsi_persen: number; // kontribusi bahan ini terhadap HPP, 0..100
}

export interface Rekomendasi {
    id_produk: string;
    nama_produk: string;
    harga_jual: number;
    hpp_baseline: number;
    hpp: number | null;
    perubahan_persen: number | null; // persen, 13.8 berarti +13,8%
    margin_persen: number | null;
    margin_awal_persen: number | null;
    keputusan: Keputusan;
    urgensi: Urgensi; // hanya terisi saat NAIKKAN HARGA
    harga_saran: number | null; // hanya saat NAIKKAN HARGA
    kenaikan_rp: number | null; // hanya saat NAIKKAN HARGA
    diskon_maks_persen: number | null; // hanya saat BERI PROMO
    hemat_per_porsi: number | null; // hanya saat BERI PROMO
    keterangan: string; // kalimat penjelas siap tampil
    rincian: RincianBahan[]; // kosong saat DATA TIDAK LENGKAP
    // Tambahan SAW. Kosong (null atau tidak ada) untuk DATA TIDAK LENGKAP dan pada backend lama.
    porsi_maks_persen?: number | null; // porsi bahan termahal terhadap HPP, 0..100
    skor_saw?: number | null; // skor preferensi 0..1, makin tinggi makin mendesak ditindak
    peringkat?: number | null; // 1 = paling prioritas
    saw_normal?: Record<string, number> | null; // nilai ternormalisasi per kriteria, kunci = kode (C1..C4)
}

// ---------- SAW dan AHP ----------

export interface SawKriteria {
    kode: string; // 'C1'..'C4'
    nama: string;
    tipe: "benefit" | "cost";
    bobot: number; // bobot yang dipakai, total 1
    referensi: number; // nilai max (benefit) atau min (cost) di antara alternatif
}

export interface AhpKriteriaBobot {
    kode: string;
    nama: string;
    bobot: number;
}

/** Hasil hitung AHP: bobot, matriks penuh, dan uji konsistensi. */
export interface AhpInfo {
    matriks_sumber: "default" | "sheet"; // 'default' = sheet Matriks_AHP belum ada
    kriteria: AhpKriteriaBobot[];
    matriks: number[][]; // matriks penuh n x n
    lambda_max: number;
    ci: number;
    ri: number;
    cr: number; // konsisten bila di bawah ambang_cr
    ambang_cr: number;
    konsisten: boolean;
}

export interface SawInfo {
    jumlah_alternatif: number;
    sumber_bobot: "AHP" | "manual";
    ahp: AhpInfo | null;
    peringatan: string; // terisi bila AHP gagal dan bobot manual dipakai
    kriteria: SawKriteria[];
}

/** Respons getAhp dan saveMatriksAHP. */
export interface AhpResult extends AhpInfo {
    gunakan_ahp: boolean;
    bobot_dipakai: "AHP" | "manual";
    peringatan: string;
}

export interface SaveMatriksAhpPayload {
    /** Matriks n x n. Backend hanya membaca segitiga atas, sisanya dihitung ulang. */
    matriks: number[][];
}

export interface Ringkasan {
    total: number;
    naik: number;
    promo: number;
    tahan: number;
    data: number; // jumlah produk berstatus DATA TIDAK LENGKAP
}

export interface RekomendasiResult {
    tanggal_data: string; // 'YYYY-MM-DD', tanggal harga bahan terbaru
    pengaturan: Pengaturan;
    ringkasan: Ringkasan;
    metode?: string; // mis. 'SAW (Simple Additive Weighting)'
    saw?: SawInfo | null; // null bila tidak ada produk dengan data lengkap
    items: Rekomendasi[]; // urut peringkat SAW; DATA TIDAK LENGKAP di akhir (backend lama: naik, promo, tahan, data)
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
    dates: string[]; // sumbu X
    bahan: Record<string, { satuan: string; values: (number | null)[] }>;
    produk: TrenProduk[];
    hpp: Record<string, (number | null)[]>; // kunci = id_produk
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
    skor_saw?: number | null; // baris riwayat lama belum punya skor
    peringkat?: number | null;
    urut: number;
}

export interface PingResult {
    status: string;
    waktu: string; // ISO timestamp
}

export interface AddHargaResult {
    status: string; // 'ok'
    tanggal: string;
    bahan: string;
    harga: number;
}

export interface SimpanRiwayatResult {
    tanggal: string;
    disimpan: number; // jumlah keputusan yang baru ditulis
    dilewati: number; // sudah ada untuk tanggal itu, tidak digandakan
}

// ---------- Payload permintaan (tambahan frontend, mengikuti docs/02 bagian daftar endpoint) ----------

export interface AddHargaPayload {
    tanggal: string;
    bahan: string;
    harga: number;
}
