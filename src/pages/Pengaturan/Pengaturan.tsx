import { api } from "@/api/endpoints";
import { AsyncContent } from "@/components/AsyncContent";
import { Card } from "@/components/Card";
import { useDashboard } from "@/context/dashboardContext";
import { useApi } from "@/hooks/useApi";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { AhpCard } from "./AhpCard";
import { PengaturanForm } from "./PengaturanForm";
import styles from "./Pengaturan.module.scss";

export function Pengaturan() {
    useDocumentTitle("Pengaturan");
    const pengaturan = useApi(api.getPengaturan);
    const ahp = useApi(api.getAhp);
    const { reload: reloadDashboard } = useDashboard();

    return (
        <div className={styles.page}>
            {/* Form diberi key dari isi data agar terisi ulang kalau "Muat ulang" membawa nilai baru. */}
            <Card title="Pengaturan aturan keputusan" variant="box">
                <AsyncContent
                    data={pengaturan.data}
                    error={pengaturan.error}
                    loading={pengaturan.loading}
                    onRetry={pengaturan.reload}
                    isEmpty={() => false}
                    emptyMessage=""
                    loadingMessage="Memuat pengaturan..."
                >
                    {(data) => (
                        <PengaturanForm
                            key={JSON.stringify(data)}
                            initial={data}
                            onSaved={reloadDashboard}
                        />
                    )}
                </AsyncContent>
            </Card>

            {/* Setelah disimpan, kartu memakai hasil dari respons simpan; dashboard dimuat ulang agar peringkat memakai bobot baru. */}
            <Card title="Bobot kriteria (AHP)" variant="box">
                <AsyncContent
                    data={ahp.data}
                    error={ahp.error}
                    loading={ahp.loading}
                    onRetry={ahp.reload}
                    isEmpty={() => false}
                    emptyMessage=""
                    loadingMessage="Memuat matriks AHP..."
                >
                    {(data) => (
                        <AhpCard
                            key={JSON.stringify(data.matriks)}
                            initial={data}
                            onSaved={reloadDashboard}
                        />
                    )}
                </AsyncContent>
            </Card>
        </div>
    );
}
