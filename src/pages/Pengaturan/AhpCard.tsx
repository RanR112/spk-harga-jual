import { useMemo, useState } from "react";
import { api } from "@/api/endpoints";
import type { AhpResult } from "@/api/types";
import {
    AHP_CR_MAKS,
    AHP_KRITERIA,
    SAATY_SCALE,
    bangunMatriks,
    formatAngka,
    formatBobot,
    hitungAhp,
    nearestSaatyIndex,
    saatyLabel,
    saatyOptionLabel,
} from "@/utils/ahp";
import styles from "./AhpCard.module.scss";

interface AhpCardProps {
    /** Hasil getAhp: matriks tersimpan (atau matriks bawaan bila sheet belum ada). */
    initial: AhpResult;
    /** Dipanggil setelah matriks tersimpan, supaya dashboard memuat ulang peringkat dengan bobot baru. */
    onSaved: () => void;
}

/** Pilihan per sel segitiga atas: kunci "baris-kolom", nilai = posisi pada SAATY_SCALE. */
type Choice = Record<string, number>;

const key = (i: number, j: number) => `${i}-${j}`;

/** Posisi nilai 1 ("sama penting") pada SAATY_SCALE; dipakai sebagai nilai bawaan. */
const SAATY_SATU = Math.max(0, SAATY_SCALE.indexOf(1));

function choiceFrom(matriks: number[][]): Choice {
    const choice: Choice = {};
    for (let i = 0; i < AHP_KRITERIA.length; i++) {
        for (let j = i + 1; j < AHP_KRITERIA.length; j++) {
            choice[key(i, j)] = nearestSaatyIndex(matriks[i]?.[j] ?? 1);
        }
    }
    return choice;
}

function sameChoice(a: Choice, b: Choice): boolean {
    return Object.keys(a).every((k) => a[k] === b[k]);
}

/** Nilai Saaty untuk sel (i, j); jatuh ke 1 (sama penting) bila pilihan atau indeks tidak ada. */
function saatyValue(choice: Choice, i: number, j: number): number {
    const idx = choice[key(i, j)] ?? SAATY_SATU;
    return SAATY_SCALE[idx] ?? 1;
}

/** Nilai sel matriks dengan fallback aman. */
function cell(m: number[][], i: number, j: number): number {
    return m[i]?.[j] ?? 1;
}

/**
 * Editor matriks perbandingan berpasangan AHP. Hanya segitiga atas yang bisa diisi; segitiga bawah
 * (kebalikannya) dan diagonal dihitung otomatis. Bobot dan CR dihitung langsung saat pilihan berubah,
 * sedangkan angka resmi tetap dari backend setelah disimpan.
 */
export function AhpCard({ initial, onSaved }: AhpCardProps) {
    const [choice, setChoice] = useState<Choice>(() =>
        choiceFrom(initial.matriks),
    );
    const [saved, setSaved] = useState<Choice>(() =>
        choiceFrom(initial.matriks),
    );
    const [server, setServer] = useState<AhpResult>(initial);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const matriks = useMemo(
        () => bangunMatriks((i, j) => saatyValue(choice, i, j)),
        [choice],
    );
    const hasil = useMemo(() => hitungAhp(matriks), [matriks]);
    const dirty = !sameChoice(choice, saved);

    async function save() {
        setSaving(true);
        setError("");
        try {
            const result = await api.saveMatriksAHP({ matriks });
            setServer(result);
            setSaved(choice);
            onSaved();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Matriks gagal disimpan.",
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className={styles.root}>
            <p className={styles.intro}>
                Bandingkan seberapa penting kriteria di <strong>baris</strong>{" "}
                dibanding kriteria di <strong>kolom</strong>. Nilai di atas 1
                berarti baris lebih penting, di bawah 1 berarti kolom lebih
                penting. Bobot yang dihasilkan dipakai untuk menghitung skor
                prioritas produk.
            </p>

            <dl className={styles.legend}>
                {AHP_KRITERIA.map((k) => (
                    <div key={k.kode}>
                        <dt>{k.kode}</dt>
                        <dd>{k.nama}</dd>
                    </div>
                ))}
            </dl>

            <div className={styles.scroll}>
                <table className={styles.matrix}>
                    <caption className="visually-hidden">
                        Matriks perbandingan berpasangan antar kriteria
                    </caption>
                    <thead>
                        <tr>
                            <td />
                            {AHP_KRITERIA.map((k) => (
                                <th key={k.kode} scope="col">
                                    {k.kode}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {AHP_KRITERIA.map((rowK, i) => (
                            <tr key={rowK.kode}>
                                <th scope="row">{rowK.kode}</th>
                                {AHP_KRITERIA.map((colK, j) => (
                                    <td key={colK.kode}>
                                        {i === j && (
                                            <span className={styles.diag}>
                                                1
                                            </span>
                                        )}
                                        {j > i && (
                                            <select
                                                className={styles.select}
                                                value={
                                                    choice[key(i, j)] ??
                                                    SAATY_SATU
                                                }
                                                onChange={(event) =>
                                                    setChoice({
                                                        ...choice,
                                                        [key(i, j)]: Number(
                                                            event.target.value,
                                                        ),
                                                    })
                                                }
                                                aria-label={`${rowK.kode} dibanding ${colK.kode}: ${rowK.nama} terhadap ${colK.nama}`}
                                            >
                                                {SAATY_SCALE.map(
                                                    (value, idx) => (
                                                        <option
                                                            key={idx}
                                                            value={idx}
                                                        >
                                                            {saatyOptionLabel(
                                                                value,
                                                            )}
                                                        </option>
                                                    ),
                                                )}
                                            </select>
                                        )}
                                        {j < i && (
                                            <span className={styles.recip}>
                                                {saatyLabel(
                                                    cell(matriks, i, j),
                                                )}
                                            </span>
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <section aria-labelledby="ahp-bobot">
                <h3 id="ahp-bobot" className={styles.small}>
                    Bobot hasil perhitungan
                </h3>
                <ul className={styles.weights}>
                    {AHP_KRITERIA.map((k, i) => {
                        const bobot = hasil.bobot[i] ?? 0;
                        return (
                            <li key={k.kode}>
                                <span className={styles.wName}>
                                    <b>{k.kode}</b> {k.nama}
                                </span>
                                <span
                                    className={styles.wBar}
                                    aria-hidden="true"
                                >
                                    <span
                                        style={{
                                            inlineSize: `${bobot * 100}%`,
                                        }}
                                    />
                                </span>
                                <span className={styles.wValue}>
                                    {formatBobot(bobot)}
                                </span>
                            </li>
                        );
                    })}
                </ul>

                <p
                    className={`${styles.cr} ${hasil.konsisten ? styles.ok : styles.warn}`}
                    role="status"
                >
                    CR {formatAngka(hasil.cr, 4)} · batas{" "}
                    {formatAngka(AHP_CR_MAKS, 1)} ·{" "}
                    {hasil.konsisten
                        ? "penilaian konsisten"
                        : "penilaian belum konsisten"}
                </p>
                <p className={styles.detail}>
                    λ maks {formatAngka(hasil.lambdaMax, 3)} · CI{" "}
                    {formatAngka(hasil.ci, 4)} · RI {formatAngka(hasil.ri, 2)}
                </p>
                {!hasil.konsisten && (
                    <p className={styles.hint}>
                        Ada penilaian yang saling bertentangan, misalnya A lebih
                        penting dari B, B dari C, tetapi C dari A. Selama CR
                        belum di bawah batas, skor prioritas tetap memakai bobot
                        manual.
                    </p>
                )}
            </section>

            <section aria-labelledby="ahp-status">
                <h3 id="ahp-status" className={styles.small}>
                    Yang dipakai saat ini
                </h3>
                <p className={styles.detail}>
                    Skor prioritas memakai bobot{" "}
                    <strong>
                        {server.bobot_dipakai === "AHP" ? "AHP" : "manual"}
                    </strong>
                    {server.matriks_sumber === "default" &&
                        " dari matriks bawaan (sheet Matriks_AHP belum dibuat)"}
                    .
                </p>
                {server.peringatan && (
                    <p className={styles.hint}>{server.peringatan}</p>
                )}
            </section>

            <div className={styles.actions}>
                <button
                    type="button"
                    className={styles.save}
                    onClick={save}
                    disabled={
                        saving || (!dirty && server.matriks_sumber === "sheet")
                    }
                >
                    {saving ? "Menyimpan..." : "Simpan matriks"}
                </button>
                <span className={styles.state} role="status">
                    {dirty
                        ? "Ada perubahan yang belum disimpan."
                        : server.matriks_sumber === "sheet"
                          ? "Tersimpan."
                          : ""}
                </span>
            </div>
            {error && (
                <p className={styles.error} role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}
