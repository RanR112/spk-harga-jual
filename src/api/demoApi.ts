/**
 * Sumber data mode demo: respons asli dari docs/fixtures, disajikan tanpa jaringan.
 * Aksi tulis hanya disimulasikan di memori dan hilang saat halaman dimuat ulang.
 * Keputusan tidak dihitung ulang di sini, sama seperti di frontend lainnya.
 */
import dashboardFixture from "@fixtures/getDashboard.json";
import trenFixture from "@fixtures/getTrenData.json";
import hargaFixture from "@fixtures/getHargaTerbaru.json";
import pengaturanFixture from "@fixtures/getPengaturan.json";
import riwayatFixture from "@fixtures/getRiwayat.json";
import simpanFixture from "@fixtures/simpanKeRiwayat.json";
import { DEFAULT_MATRIX, bangunMatriks, ringkasAhp } from "@/utils/ahp";
import { ApiError } from "./client";
import type { Api } from "./endpoints";
import type {
    AddHargaResult,
    AhpResult,
    DashboardData,
    InputHarga,
    Pengaturan,
    RiwayatRow,
    SimpanRiwayatResult,
    TrenData,
} from "./types";

const DEMO_DELAY_MS = 350;

function unwrap<T>(fixture: unknown): T {
    const { data } = fixture as { data: T };
    return structuredClone(data);
}

function later<T>(value: T): Promise<T> {
    return new Promise((resolve) =>
        setTimeout(() => resolve(structuredClone(value)), DEMO_DELAY_MS),
    );
}

function fail(message: string): Promise<never> {
    return new Promise((_, reject) =>
        setTimeout(
            () => reject(new ApiError("server", message)),
            DEMO_DELAY_MS,
        ),
    );
}

/** Hasil AHP mode demo: dihitung dari matriks di memori dengan rumus yang sama dengan backend. */
function ahpResult(
    matriks: number[][],
    sumber: AhpResult["matriks_sumber"],
): AhpResult {
    const info = ringkasAhp(matriks, sumber);
    return {
        ...info,
        gunakan_ahp: true,
        bobot_dipakai: info.konsisten ? "AHP" : "manual",
        peringatan: info.konsisten
            ? ""
            : `Matriks AHP tidak konsisten (CR ${info.cr} >= ${info.ambang_cr}). Bobot manual dipakai.`,
    };
}

const state = {
    ahp: {
        matriks: DEFAULT_MATRIX,
        sumber: "default" as AhpResult["matriks_sumber"],
    },
    dashboard: unwrap<DashboardData>(dashboardFixture),
    tren: unwrap<TrenData>(trenFixture),
    harga: unwrap<InputHarga[]>(hargaFixture),
    pengaturan: unwrap<Pengaturan>(pengaturanFixture),
    riwayat: unwrap<RiwayatRow[]>(riwayatFixture),
    simpan: unwrap<SimpanRiwayatResult>(simpanFixture),
};

export const demoApi: Api = {
    ping: () => later({ status: "ok", waktu: new Date().toISOString() }),
    getDashboard: () => later(state.dashboard),
    getTrenData: () => later(state.tren),
    getHargaTerbaru: (limit = 15) => later(state.harga.slice(0, limit)),
    getPengaturan: () => later(state.pengaturan),
    getRiwayat: (limit = 300) => later(state.riwayat.slice(0, limit)),
    getAhp: () => later(ahpResult(state.ahp.matriks, state.ahp.sumber)),

    addHargaBahan(payload) {
        if (!(payload.harga > 0)) return fail("Harga harus lebih dari 0.");
        const known = state.dashboard.bahan.find(
            (item) => item.nama === payload.bahan,
        );
        if (!known)
            return fail(`Bahan "${payload.bahan}" belum ada di sheet harga.`);
        // Upsert seperti backend: tanggal dan bahan yang sama diperbarui, bukan ditambah.
        const rest = state.harga.filter(
            (row) =>
                !(
                    row.tanggal === payload.tanggal &&
                    row.bahan === payload.bahan
                ),
        );
        const urut = Math.max(0, ...state.harga.map((row) => row.urut)) + 1;
        state.harga = [{ ...payload, satuan: known.satuan, urut }, ...rest];
        if (payload.tanggal > state.dashboard.rekomendasi.tanggal_data) {
            state.dashboard.rekomendasi.tanggal_data = payload.tanggal;
        }
        const result: AddHargaResult = { status: "ok", ...payload };
        return later(result);
    },

    savePengaturan(payload) {
        if (payload.margin_target_persen < payload.margin_minimum_persen) {
            return fail(
                "Margin target tidak boleh lebih kecil dari margin minimum.",
            );
        }
        // Gabung, bukan ganti: kunci baru (bobot SAW, gunakan_ahp) yang tidak dikirim form tetap dipertahankan.
        state.pengaturan = { ...state.pengaturan, ...payload };
        return later(state.pengaturan);
    },

    saveMatriksAHP(payload) {
        const input = payload.matriks;
        const n = state.ahp.matriks.length;
        if (!Array.isArray(input) || input.length !== n)
            return fail(`Matriks harus berukuran ${n} x ${n}.`);
        try {
            state.ahp = {
                matriks: bangunMatriks((i, j) => Number(input[i]?.[j])),
                sumber: "sheet",
            };
        } catch (error) {
            return fail(
                error instanceof Error ? error.message : "Matriks tidak valid.",
            );
        }
        return later(ahpResult(state.ahp.matriks, state.ahp.sumber));
    },

    simpanKeRiwayat: () =>
        later({
            ...state.simpan,
            tanggal: state.dashboard.rekomendasi.tanggal_data,
        }),
};
