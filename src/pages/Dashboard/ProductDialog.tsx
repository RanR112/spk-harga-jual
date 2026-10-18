import type { Rekomendasi } from "@/api/types";
import { Badge } from "@/components/Badge";
import { Modal } from "@/components/Modal";
import { KEPUTUSAN_LABEL, TEXT } from "@/constants/text";
import { useDashboard } from "@/context/dashboardContext";
import { formatBobot, formatSkor } from "@/utils/ahp";
import { formatPercent, formatRupiah } from "@/utils/format";
import { RincianTable } from "./RincianTable";
import styles from "./ProductDialog.module.scss";

interface ProductDialogProps {
    item: Rekomendasi;
    onClose: () => void;
}

interface Fact {
    label: string;
    value: string;
    /** Nama kelas warna untuk nilai (mengikuti keputusan). */
    tone?: string;
}

/** Bagian "Perbandingan": angka pendukung yang tidak muat di baris tabel utama. */
function facts(item: Rekomendasi): Fact[] {
    const tone = styles[KEPUTUSAN_LABEL[item.keputusan]?.key ?? "data"];
    const list: Fact[] = [
        { label: "HPP baseline", value: formatRupiah(item.hpp_baseline) },
        { label: "HPP sekarang", value: formatRupiah(item.hpp) },
        {
            label: "Perubahan HPP",
            value: formatPercent(item.perubahan_persen, { signed: true }),
            tone,
        },
        {
            label: "Margin awal → sekarang",
            value: `${formatPercent(item.margin_awal_persen)} → ${formatPercent(item.margin_persen)}`,
        },
        { label: "Harga jual sekarang", value: formatRupiah(item.harga_jual) },
    ];
    if (item.keputusan === "NAIKKAN HARGA") {
        list.push({
            label: "Harga saran",
            value: formatRupiah(item.harga_saran),
        });
        list.push({
            label: "Kenaikan",
            value: formatRupiah(item.kenaikan_rp, { signed: true }),
        });
    }
    if (item.keputusan === "BERI PROMO") {
        list.push({
            label: "Diskon aman maks",
            value: formatPercent(item.diskon_maks_persen),
        });
        list.push({
            label: "Hemat per porsi",
            value: formatRupiah(item.hemat_per_porsi),
        });
    }
    return list;
}

/** Skor SAW per kriteria: nilai ternormalisasi x bobot = kontribusi. Hanya tampil bila backend mengirim data SAW. */
function SawSection({ item }: { item: Rekomendasi }) {
    const { data } = useDashboard();
    const saw = data?.rekomendasi.saw;
    if (!saw || item.skor_saw == null || !item.saw_normal) return null;
    const normal = item.saw_normal;

    return (
        <section className={styles.saw} aria-labelledby="dialog-saw">
            <h3 id="dialog-saw" className={styles.small}>
                Skor prioritas SAW
            </h3>
            <p className={styles.note}>
                Peringkat {item.peringkat} dari {saw.jumlah_alternatif} produk
                dengan skor {formatSkor(item.skor_saw)}. Makin tinggi skor,
                makin mendesak produk ini ditindak. Bobot kriteria dari{" "}
                {saw.sumber_bobot === "AHP" ? "AHP" : "pengaturan manual"}.
            </p>
            {saw.peringatan && <p className={styles.note}>{saw.peringatan}</p>}
            <div className={styles.sawScroll}>
                <table className={styles.sawTable}>
                    <caption className="visually-hidden">
                        Rincian skor SAW {item.nama_produk}
                    </caption>
                    <thead>
                        <tr>
                            <th scope="col">Kriteria</th>
                            <th scope="col">Tipe</th>
                            <th scope="col" className={styles.num}>
                                Bobot
                            </th>
                            <th scope="col" className={styles.num}>
                                Nilai
                            </th>
                            <th scope="col" className={styles.num}>
                                Kontribusi
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {saw.kriteria.map((k) => {
                            const nilai = normal[k.kode] ?? 0;
                            return (
                                <tr key={k.kode}>
                                    <th scope="row">
                                        <span className={styles.kodeKriteria}>
                                            {k.kode}
                                        </span>{" "}
                                        {k.nama}
                                    </th>
                                    <td>
                                        {k.tipe === "benefit"
                                            ? "Benefit"
                                            : "Cost"}
                                    </td>
                                    <td className={styles.num}>
                                        {formatBobot(k.bobot)}
                                    </td>
                                    <td className={styles.num}>
                                        {formatSkor(nilai)}
                                    </td>
                                    <td className={styles.num}>
                                        {formatSkor(k.bobot * nilai)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr>
                            <th scope="row" colSpan={4}>
                                Skor SAW
                            </th>
                            <td className={styles.num}>
                                {formatSkor(item.skor_saw)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </section>
    );
}

export function ProductDialog({ item, onClose }: ProductDialogProps) {
    return (
        <Modal
            title={item.nama_produk}
            titleAddon={<Badge keputusan={item.keputusan} large />}
            onClose={onClose}
        >
            <div className={styles.content}>
                <section aria-labelledby="dialog-perbandingan">
                    <h3 id="dialog-perbandingan" className={styles.small}>
                        Perbandingan
                    </h3>
                    <dl className={styles.facts}>
                        {facts(item).map((fact) => (
                            <div key={fact.label}>
                                <dt>{fact.label}</dt>
                                <i aria-hidden="true" />
                                <dd className={fact.tone}>{fact.value}</dd>
                            </div>
                        ))}
                    </dl>
                </section>

                <section aria-labelledby="dialog-keterangan">
                    <h3 id="dialog-keterangan" className={styles.small}>
                        Keterangan
                    </h3>
                    {item.keterangan && (
                        <p className={styles.note}>{item.keterangan}</p>
                    )}
                    {item.rincian.length === 0 ? (
                        <p className={styles.empty}>{TEXT.emptyRincian}</p>
                    ) : (
                        <RincianTable
                            caption={`Rincian bahan ${item.nama_produk}`}
                            rows={item.rincian}
                            total={item.hpp}
                        />
                    )}
                </section>

                <SawSection item={item} />
            </div>
        </Modal>
    );
}
