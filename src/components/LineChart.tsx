import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  LineElement,
  PointElement,
  type ChartData,
  type ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useChartColors } from '@/hooks/useChartColors';
import { bukuKasPlugin, setBukuKasConfig, type EndLabel, type Zone } from '@/utils/bukuKasPlugin';
import { formatDateShort, formatRupiah } from '@/utils/format';
import styles from './LineChart.module.scss';

// Legenda, tooltip, dan Filler sengaja tidak didaftarkan: mockup memakai label langsung dan baris pembacaan.
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, bukuKasPlugin);

export type SeriesColor = 'hpp' | 'baseline' | 'naik' | 'promo' | 'bahan';

export interface Series {
  label: string;
  data: (number | null)[];
  color: SeriesColor;
  /** Pola garis putus-putus, misalnya `[7, 5]`. */
  dash?: number[];
  /** Garis utama: lebih tebal, dan titik terakhirnya ditandai lingkaran berongga. */
  main?: boolean;
  /** Label langsung di ujung kanan garis, misalnya `{ text: 'Batas naik +10,0%', amount: 'Rp13.820' }`. */
  endLabel?: { text: string; amount: string };
}

interface LineChartProps {
  /** Tanggal ISO untuk sumbu X. */
  dates: string[];
  series: Series[];
  /** Deskripsi grafik untuk pembaca layar. */
  description: string;
  /** Daerah arsiran di antara dua nilai, misalnya zona wajar HPP. */
  zone?: Zone;
  /** Dipanggil saat titik yang disentuh atau ditunjuk kursor berubah; `null` saat pointer keluar. */
  onActiveChange?: (index: number | null) => void;
}

// Di bawah lebar ini label garis ditaruh di atas garis, bukan di kanan area grafik.
const COMPACT_WIDTH = 560;
const RIGHT_PADDING = 196;
const X_LABELS = 7;
const X_LABELS_COMPACT = 4;

/** Indeks tanggal berjarak rata, selalu memuat tanggal pertama dan terakhir. */
function spacedIndices(count: number, wanted: number): number[] {
  if (count <= wanted) return Array.from({ length: count }, (_, index) => index);
  return Array.from({ length: wanted }, (_, step) => Math.round((step * (count - 1)) / (wanted - 1)));
}

function lastValue(data: (number | null)[]): number | null {
  for (let i = data.length - 1; i >= 0; i -= 1) {
    const value = data[i];
    if (typeof value === 'number') return value;
  }
  return null;
}

/** Grafik garis bernilai rupiah dengan sumbu tanggal, bergaya buku kas (lihat docs/03 bagian Tren). */
export function LineChart({ dates, series, description, zone, onActiveChange }: LineChartProps) {
  const colors = useChartColors();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(false);

  // Mengikuti lebar wadah, bukan lebar layar, karena grafik bisa berada di kolom sempit.
  useEffect(() => {
    const element = wrapperRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setCompact(entry.contentRect.width < COMPACT_WIDTH);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const mainIndex = Math.max(0, series.findIndex((item) => item.main));

  const labels = useMemo<EndLabel[]>(
    () =>
      series.flatMap((item): EndLabel[] => {
        const value = lastValue(item.data);
        if (!item.endLabel || value === null) return [];
        return [{ value, text: item.endLabel.text, amount: item.endLabel.amount, color: colors[item.color], bold: item.main }];
      }),
    [series, colors],
  );

  // Plugin bukuKasPlugin didaftarkan sekali di atas dan membaca konfigurasi per kanvas. Diperbarui lewat layout effect
  // agar sudah terbaru sebelum efek react-chartjs-2 (di komponen anak) menggambar ulang grafik.
  useLayoutEffect(() => {
    const canvas = wrapperRef.current?.querySelector('canvas');
    if (canvas) setBukuKasConfig(canvas, { colors, compact, zone, labels, mainDatasetIndex: mainIndex, onActiveChange });
  });

  // Font monospasi 600/700 baru dimuat saat dipakai; gambar ulang setelah semua font siap.
  useEffect(() => {
    let active = true;
    document.fonts?.ready.then(() => {
      const canvas = wrapperRef.current?.querySelector('canvas');
      if (active && canvas) ChartJS.getChart(canvas)?.update('none');
    });
    return () => {
      active = false;
    };
  }, []);

  const data = useMemo<ChartData<'line', (number | null)[], string>>(
    () => ({
      labels: dates.map(formatDateShort),
      datasets: series.map((item) => {
        const last = item.data.length - 1;
        return {
          label: item.label,
          data: item.data,
          borderColor: colors[item.color],
          backgroundColor: colors[item.color],
          borderWidth: item.main ? 1.75 : 1.25,
          borderDash: item.dash ?? [],
          borderJoinStyle: 'round' as const,
          borderCapStyle: 'round' as const,
          // Hanya titik terakhir garis utama yang ditandai: lingkaran berongga.
          pointRadius: item.main ? (context: { dataIndex: number }) => (context.dataIndex === last ? 4.5 : 0) : 0,
          pointHoverRadius: 0,
          pointBackgroundColor: colors.permukaan,
          pointBorderColor: colors[item.color],
          pointBorderWidth: 2,
          // Nilai null pada tanggal tanpa data tidak memutus garis.
          spanGaps: true,
          tension: 0,
        };
      }),
    }),
    [dates, series, colors],
  );

  const options = useMemo<ChartOptions<'line'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: 'index', intersect: false },
      font: { family: colors.mono || undefined, size: 12 },
      layout: { padding: { top: 16, right: compact ? 20 : RIGHT_PADDING, bottom: 0, left: 0 } },
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: {
        x: {
          border: { color: colors.text, width: 1.25 },
          // Tanggal pertama dan terakhir selalu berlabel (rata ke dalam), sisanya berjarak rata.
          afterBuildTicks: (axis) => {
            axis.ticks = spacedIndices(dates.length, compact ? X_LABELS_COMPACT : X_LABELS).map((value) => ({ value }));
          },
          ticks: {
            color: colors.text,
            autoSkip: false,
            align: 'inner',
            maxRotation: 0,
            padding: 8,
            font: { family: colors.mono || undefined, size: 12 },
          },
          grid: { drawOnChartArea: false, drawTicks: true, tickLength: 5, tickColor: colors.text },
        },
        y: {
          grace: '8%',
          border: { display: false },
          ticks: {
            color: colors.text,
            maxTicksLimit: 6,
            padding: 8,
            font: { family: colors.mono || undefined, size: 12 },
            callback: (value) => formatRupiah(typeof value === 'number' ? value : Number(value)),
          },
          grid: { color: colors.grid, lineWidth: 1 },
        },
      },
    }),
    [colors, compact, dates.length],
  );

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <Line data={data} options={options} role="img" aria-label={description} />
    </div>
  );
}
