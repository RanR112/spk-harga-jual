/**
 * AHP di sisi frontend. Dipakai untuk (1) pratinjau bobot dan CR saat matriks diedit sebelum disimpan,
 * dan (2) mode demo. Sumber kebenaran tetap backend (AHP.gs): rumus dan konstanta di sini sengaja
 * sama persis dengan di sana, dan hasil simpan dari backend yang ditampilkan setelah disimpan.
 */
import type { AhpInfo } from "@/api/types";

export interface AhpKriteria {
    kode: string;
    nama: string;
}

/** Urutan = urutan baris dan kolom matriks. Harus sama dengan AHP_KRITERIA di config.gs. */
export const AHP_KRITERIA: readonly AhpKriteria[] = [
    { kode: "C1", nama: "Perubahan HPP (absolut, %)" },
    { kode: "C2", nama: "Margin saat ini (%)" },
    { kode: "C3", nama: "Selisih margin dari target (%)" },
    { kode: "C4", nama: "Porsi bahan termahal terhadap HPP (%)" },
];

/** Batas konsistensi: CR di bawah angka ini dianggap konsisten. */
export const AHP_CR_MAKS = 0.1;

/** Random Index Saaty menurut ukuran matriks. */
const AHP_RI: Record<number, number> = {
    1: 0,
    2: 0,
    3: 0.58,
    4: 0.9,
    5: 1.12,
    6: 1.24,
    7: 1.32,
    8: 1.41,
    9: 1.45,
    10: 1.49,
};

/** Pilihan nilai perbandingan: 9 sampai 1, lalu kebalikannya 1/2 sampai 1/9. */
export const SAATY_SCALE: readonly number[] = [
    9,
    8,
    7,
    6,
    5,
    4,
    3,
    2,
    1,
    1 / 2,
    1 / 3,
    1 / 4,
    1 / 5,
    1 / 6,
    1 / 7,
    1 / 8,
    1 / 9,
];

const SAATY_MIN = 1 / 9;
const SAATY_MAX = 9;
const EPS = 1e-9;

export function isNilaiSaaty(x: number): boolean {
    return Number.isFinite(x) && x >= SAATY_MIN - EPS && x <= SAATY_MAX + EPS;
}

/**
 * Bangun matriks penuh dari segitiga atas: diagonal 1, sel bawah = kebalikan sel atas.
 * Melempar Error bila ada nilai di luar 1/9 sampai 9.
 */
export function bangunMatriks(
    upper: (i: number, j: number) => number,
    n: number = AHP_KRITERIA.length,
): number[][] {
    const m: number[][] = Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)),
    );
    for (let i = 0; i < n; i++) {
        const rowI = m[i];
        if (!rowI) continue;
        for (let j = i + 1; j < n; j++) {
            const rowJ = m[j];
            if (!rowJ) continue;
            const x = upper(i, j);
            if (!isNilaiSaaty(x)) {
                throw new Error(
                    `Nilai perbandingan ${AHP_KRITERIA[i]?.kode ?? i + 1} vs ${AHP_KRITERIA[j]?.kode ?? j + 1} harus di antara 1/9 dan 9.`,
                );
            }
            rowI[j] = x;
            rowJ[i] = 1 / x;
        }
    }
    return m;
}

/** Matriks contoh yang sama dengan AHP_DEFAULT_MATRIX di config.gs (hanya segitiga atas yang dibaca). */
const DEFAULT_UPPER: number[][] = [
    [1, 1 / 2, 2, 3],
    [2, 1, 3, 4],
    [1 / 2, 1 / 3, 1, 2],
    [1 / 3, 1 / 4, 1 / 2, 1],
];
export const DEFAULT_MATRIX: number[][] = bangunMatriks(
    (i, j) => DEFAULT_UPPER[i]?.[j] ?? 1,
);

export interface HasilAhp {
    bobot: number[];
    lambdaMax: number;
    ci: number;
    ri: number;
    cr: number;
    konsisten: boolean;
}

/** Bobot per kriteria (rata-rata baris matriks ternormalisasi) beserta uji konsistensi. */
export function hitungAhp(matrix: number[][]): HasilAhp {
    const n = matrix.length;
    const colSum: number[] = Array.from({ length: n }, (_, j) =>
        matrix.reduce((sum, row) => sum + (row[j] ?? 0), 0),
    );
    const bobot: number[] = matrix.map(
        (row) => row.reduce((sum, x, j) => sum + x / (colSum[j] ?? 1), 0) / n,
    );
    const lambdaMax =
        matrix.reduce(
            (sum, row, i) =>
                sum +
                row.reduce((acc, x, j) => acc + x * (bobot[j] ?? 0), 0) /
                    (bobot[i] ?? 1),
            0,
        ) / n;
    const ci = n > 1 ? Math.max(0, (lambdaMax - n) / (n - 1)) : 0;
    const ri = AHP_RI[n] ?? 0;
    const cr = ri > 0 ? ci / ri : 0;
    return { bobot, lambdaMax, ci, ri, cr, konsisten: cr < AHP_CR_MAKS };
}

const round4 = (x: number): number => Math.round(x * 10000) / 10000;

/** Bentuk yang sama dengan `ahp` pada respons backend (pembulatan 4 desimal). */
export function ringkasAhp(
    matrix: number[][],
    sumber: AhpInfo["matriks_sumber"],
): AhpInfo {
    const h = hitungAhp(matrix);
    return {
        matriks_sumber: sumber,
        kriteria: AHP_KRITERIA.map((k, i) => ({
            kode: k.kode,
            nama: k.nama,
            bobot: round4(h.bobot[i] ?? 0),
        })),
        matriks: matrix.map((row) => row.map(round4)),
        lambda_max: round4(h.lambdaMax),
        ci: round4(h.ci),
        ri: h.ri,
        cr: round4(h.cr),
        ambang_cr: AHP_CR_MAKS,
        konsisten: h.konsisten,
    };
}

// ---------- Tampilan ----------

/** Posisi nilai terdekat pada SAATY_SCALE (perbandingan dalam skala log, karena skalanya rasio). */
export function nearestSaatyIndex(value: number): number {
    if (!(value > 0)) return SAATY_SCALE.indexOf(1);
    let best = 0;
    let bestDiff = Infinity;
    SAATY_SCALE.forEach((s, idx) => {
        const diff = Math.abs(Math.log(s) - Math.log(value));
        if (diff < bestDiff) {
            best = idx;
            bestDiff = diff;
        }
    });
    return best;
}

/** 3 -> "3", 1/3 -> "1/3". */
export function saatyLabel(value: number): string {
    return value >= 1 - EPS
        ? String(Math.round(value))
        : `1/${Math.round(1 / value)}`;
}

const SAATY_TEKS: Record<number, string> = {
    1: "sama penting",
    3: "sedikit lebih penting",
    5: "lebih penting",
    7: "sangat lebih penting",
    9: "mutlak lebih penting",
};

/** Teks pilihan, mis. "3 – baris sedikit lebih penting" atau "1/5 – kolom lebih penting". */
export function saatyOptionLabel(value: number): string {
    const label = saatyLabel(value);
    if (Math.abs(value - 1) < EPS) {
        return `${label} – ${SAATY_TEKS[1] ?? "sama penting"}`;
    }
    const strength = value > 1 ? Math.round(value) : Math.round(1 / value);
    const side = value > 1 ? "baris" : "kolom";
    const teks = SAATY_TEKS[strength] ?? "nilai antara";
    return `${label} – ${side} ${teks}`;
}

/** 0,76523 -> "0,765". Kosong atau bukan angka tampil sebagai tanda hubung. */
export function formatSkor(value: number | null | undefined): string {
    return formatAngka(value, 3);
}

export function formatAngka(
    value: number | null | undefined,
    digits: number,
): string {
    if (value === null || value === undefined || !Number.isFinite(value))
        return "–";
    return value.toFixed(digits).replace(".", ",");
}

/** 0,2771 -> "27,7%". */
export function formatBobot(value: number): string {
    return `${(value * 100).toFixed(1).replace(".", ",")}%`;
}
