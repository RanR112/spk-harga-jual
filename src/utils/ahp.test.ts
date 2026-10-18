import { describe, expect, it } from "vitest";
import {
    AHP_CR_MAKS,
    DEFAULT_MATRIX,
    SAATY_SCALE,
    bangunMatriks,
    formatAngka,
    formatBobot,
    formatSkor,
    hitungAhp,
    nearestSaatyIndex,
    ringkasAhp,
    saatyLabel,
    saatyOptionLabel,
} from "./ahp";

describe("bangunMatriks", () => {
    it("mengisi diagonal 1 dan segitiga bawah dengan kebalikan", () => {
        const m = bangunMatriks((i, j) => (i === 0 && j === 1 ? 3 : 2), 3);
        expect(m[0]?.[0]).toBe(1);
        expect(m[0]?.[1]).toBe(3);
        expect(m[1]?.[0]).toBeCloseTo(1 / 3, 10);
        expect(m[2]?.[0]).toBeCloseTo(1 / 2, 10);
    });

    it("menolak nilai di luar 1/9 sampai 9 dan nilai bukan angka", () => {
        expect(() => bangunMatriks(() => 10, 3)).toThrow(/1\/9 dan 9/);
        expect(() => bangunMatriks(() => 0, 3)).toThrow();
        expect(() => bangunMatriks(() => Number.NaN, 3)).toThrow();
    });
});

describe("hitungAhp", () => {
    it("menghasilkan bobot dan CR yang sama dengan backend untuk matriks contoh", () => {
        const h = hitungAhp(DEFAULT_MATRIX);
        expect(h.bobot.map((x) => Math.round(x * 10000) / 10000)).toEqual([
            0.2771, 0.4658, 0.1611, 0.096,
        ]);
        expect(h.bobot.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
        expect(Math.round(h.lambdaMax * 10000) / 10000).toBe(4.031);
        expect(Math.round(h.cr * 10000) / 10000).toBe(0.0115);
        expect(h.konsisten).toBe(true);
    });

    it("matriks yang semua perbandingannya 1 memberi bobot sama dan CR nol", () => {
        const h = hitungAhp(bangunMatriks(() => 1));
        h.bobot.forEach((w) => expect(w).toBeCloseTo(0.25, 10));
        expect(h.cr).toBeCloseTo(0, 10);
    });

    it("menandai matriks yang saling bertentangan sebagai tidak konsisten", () => {
        const upper = [
            [1, 9, 1 / 9, 9],
            [0, 1, 9, 1 / 9],
            [0, 0, 1, 9],
        ];
        const h = hitungAhp(bangunMatriks((i, j) => upper[i]?.[j] ?? 1));
        expect(h.cr).toBeGreaterThan(AHP_CR_MAKS);
        expect(h.konsisten).toBe(false);
    });
});

describe("ringkasAhp", () => {
    it("berbentuk sama dengan respons backend", () => {
        const info = ringkasAhp(DEFAULT_MATRIX, "default");
        expect(info.matriks_sumber).toBe("default");
        expect(info.kriteria.map((k) => k.kode)).toEqual([
            "C1",
            "C2",
            "C3",
            "C4",
        ]);
        expect(info.kriteria.map((k) => k.bobot)).toEqual([
            0.2771, 0.4658, 0.1611, 0.096,
        ]);
        expect(info.cr).toBe(0.0115);
        expect(info.ri).toBe(0.9);
        expect(info.ambang_cr).toBe(0.1);
        expect(info.konsisten).toBe(true);
    });
});

describe("skala Saaty", () => {
    it("nearestSaatyIndex menemukan nilai skala terdekat, termasuk kebalikan", () => {
        expect(SAATY_SCALE[nearestSaatyIndex(3)]).toBe(3);
        expect(SAATY_SCALE[nearestSaatyIndex(1 / 3)]).toBeCloseTo(1 / 3, 10);
        expect(SAATY_SCALE[nearestSaatyIndex(1)]).toBe(1);
        expect(SAATY_SCALE[nearestSaatyIndex(0.333333)]).toBeCloseTo(1 / 3, 10);
    });

    it("saatyLabel menulis pecahan untuk nilai di bawah 1", () => {
        expect(saatyLabel(3)).toBe("3");
        expect(saatyLabel(1 / 3)).toBe("1/3");
        expect(saatyLabel(0.5)).toBe("1/2");
        expect(saatyLabel(1)).toBe("1");
    });

    it("saatyOptionLabel menyebut sisi yang lebih penting", () => {
        expect(saatyOptionLabel(1)).toBe("1 – sama penting");
        expect(saatyOptionLabel(3)).toBe("3 – baris sedikit lebih penting");
        expect(saatyOptionLabel(1 / 5)).toBe("1/5 – kolom lebih penting");
        expect(saatyOptionLabel(1 / 9)).toBe(
            "1/9 – kolom mutlak lebih penting",
        );
        expect(saatyOptionLabel(4)).toBe("4 – baris nilai antara");
    });
});

describe("format", () => {
    it("formatSkor memakai koma dan tiga desimal", () => {
        expect(formatSkor(0.76523)).toBe("0,765");
        expect(formatSkor(1)).toBe("1,000");
    });

    it("formatSkor dan formatAngka menampilkan tanda hubung untuk nilai kosong", () => {
        expect(formatSkor(null)).toBe("–");
        expect(formatSkor(undefined)).toBe("–");
        expect(formatAngka(Number.NaN, 2)).toBe("–");
    });

    it("formatBobot menampilkan persen satu desimal", () => {
        expect(formatBobot(0.2771)).toBe("27,7%");
        expect(formatBobot(0.5)).toBe("50,0%");
    });
});
