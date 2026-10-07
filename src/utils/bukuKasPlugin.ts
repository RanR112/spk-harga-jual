import type { Chart, ChartEvent, Plugin } from 'chart.js';
import type { ChartColors } from '@/utils/chartColors';

/** Label langsung di ujung kanan satu garis: nama di kiri, angka monospasi di kanan. */
export interface EndLabel {
  value: number;
  text: string;
  amount: string;
  /** Warna teks, sudah berupa nilai CSS. */
  color: string;
  /** Garis utama: huruf lebih tebal dan tanpa pemisah titik tengah. */
  bold?: boolean;
}

export interface Zone {
  from: number;
  to: number;
  label: string;
}

/** Semua yang digambar plugin di luar bawaan Chart.js. Diberikan komponen grafik tiap render. */
export interface BukuKasConfig {
  colors: ChartColors;
  /** Layar sempit: label ditaruh di atas garis dan rata kanan di dalam area grafik. */
  compact: boolean;
  zone?: Zone;
  labels: EndLabel[];
  /** Indeks dataset utama (garis HPP atau harga) untuk penanda titik. */
  mainDatasetIndex: number;
  /** Titik yang disentuh atau ditunjuk kursor berubah; `null` saat pointer keluar dari grafik. */
  onActiveChange?: (index: number | null) => void;
}

const LABEL_GAP = 16;

// Konfigurasi per kanvas. Disimpan di luar opsi Chart.js agar fungsi dan array tidak diubah menjadi
// objek "scriptable" oleh Chart.js, dan agar plugin cukup didaftarkan sekali untuk semua grafik.
const configs = new WeakMap<HTMLCanvasElement, BukuKasConfig>();
// Indeks titik yang sedang ditunjuk per grafik; tidak ada entri berarti belum pernah ditunjuk.
const hover = new WeakMap<Chart, number | null>();

/** Dipanggil komponen grafik setiap render, sebelum Chart.js menggambar ulang. */
export function setBukuKasConfig(canvas: HTMLCanvasElement, config: BukuKasConfig): void {
  configs.set(canvas, config);
}

function nearestIndex(chart: Chart, event: ChartEvent): number | null {
  const area = chart.chartArea;
  const x = event.x;
  if (x === null || x === undefined) return null;
  const count = chart.data.labels?.length ?? 0;
  if (count === 0 || area.right <= area.left) return null;
  const ratio = (x - area.left) / (area.right - area.left);
  return Math.max(0, Math.min(count - 1, Math.round(ratio * (count - 1))));
}

/**
 * Menyebar posisi y label supaya tidak bertumpuk (jarak minimal LABEL_GAP) dan tetap di antara `top` dan `bottom`.
 * Urutan vertikal label dipertahankan; hasil dikembalikan menurut urutan masukan.
 */
export function spread(ys: number[], top: number, bottom: number): number[] {
  const order = ys.map((y, index) => ({ y, index })).sort((a, b) => a.y - b.y);
  // Maju dari atas: tidak boleh di atas batas atas dan tidak boleh menempel pada label di atasnya.
  let floor = top;
  for (const entry of order) {
    entry.y = Math.max(entry.y, floor);
    floor = entry.y + LABEL_GAP;
  }
  // Mundur dari bawah: tidak boleh melewati batas bawah, dan menaikkan label di atasnya bila perlu.
  let ceiling = bottom;
  for (let i = order.length - 1; i >= 0; i -= 1) {
    const entry = order[i];
    if (!entry) continue;
    entry.y = Math.min(entry.y, ceiling);
    ceiling = entry.y - LABEL_GAP;
  }
  const result = new Array<number>(ys.length).fill(0);
  order.forEach((entry) => {
    result[entry.index] = entry.y;
  });
  return result;
}

function drawZone(chart: Chart, config: BukuKasConfig): void {
  const { zone, colors } = config;
  const y = chart.scales.y;
  if (!zone || !y) return;
  const { ctx, chartArea } = chart;
  const top = y.getPixelForValue(Math.max(zone.from, zone.to));
  const bottom = y.getPixelForValue(Math.min(zone.from, zone.to));
  ctx.save();
  ctx.fillStyle = colors.zona;
  ctx.fillRect(chartArea.left, top, chartArea.right - chartArea.left, bottom - top);
  ctx.restore();
}

function drawPointer(chart: Chart, config: BukuKasConfig): void {
  const index = hover.get(chart);
  if (index === null || index === undefined) return;
  const point = chart.getDatasetMeta(config.mainDatasetIndex).data[index];
  if (!point) return;
  const { ctx, chartArea } = chart;
  const { colors } = config;
  ctx.save();
  ctx.beginPath();
  ctx.setLineDash([2, 3]);
  ctx.lineWidth = 1;
  ctx.strokeStyle = colors.hpp;
  ctx.moveTo(point.x, chartArea.top);
  ctx.lineTo(point.x, chartArea.bottom);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
  ctx.fillStyle = colors.permukaan;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = colors.hpp;
  ctx.stroke();
  ctx.restore();
}

interface PlacedLabel {
  label: EndLabel;
  name: string;
  nameFont: string;
  amountFont: string;
  nameWidth: number;
  x: number;
  y: number;
  width: number;
}

/** Menghitung ukuran dan posisi tiap label langsung, dengan posisi y yang sudah disebar. */
function placeLabels(chart: Chart, config: BukuKasConfig): PlacedLabel[] {
  const { colors, compact, labels } = config;
  const y = chart.scales.y;
  if (!y) return [];
  const { ctx, chartArea } = chart;
  const offset = compact ? -7 : 4;
  const ys = spread(
    labels.map((label) => y.getPixelForValue(label.value) + offset),
    chartArea.top + 8,
    chartArea.bottom - 4,
  );
  return labels.map((label, i) => {
    // Garis acuan memakai pemisah titik tengah ("Baseline · Rp12.564"), garis utama cukup spasi ("HPP Rp14.302").
    const name = label.bold ? `${label.text} ` : `${label.text} · `;
    const nameFont = `${label.bold ? 700 : 600} 12px ${colors.font}`;
    const amountFont = `${label.bold ? 700 : 500} 12px ${colors.mono}`;
    ctx.font = nameFont;
    const nameWidth = ctx.measureText(name).width;
    ctx.font = amountFont;
    const width = nameWidth + ctx.measureText(label.amount).width;
    const x = compact ? chartArea.right - 6 - width : chartArea.right + 10;
    return { label, name, nameFont, amountFont, nameWidth, x, y: ys[i] ?? 0, width };
  });
}

function drawLabels(chart: Chart, config: BukuKasConfig): void {
  const { colors, zone } = config;
  const y = chart.scales.y;
  if (!y) return;
  const { ctx, chartArea } = chart;
  const placed = placeLabels(chart, config);
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';

  // Tulisan "zona wajar" di sudut bawah daerah. Dilewati kalau bertabrakan dengan label garis (layar sempit).
  if (zone) {
    ctx.font = `italic 400 12px ${colors.font}`;
    const zoneX = chartArea.left + 8;
    const zoneY = y.getPixelForValue(Math.min(zone.from, zone.to)) - 8;
    const zoneWidth = ctx.measureText(zone.label).width;
    const collides = placed.some(
      (item) => Math.abs(item.y - zoneY) < LABEL_GAP && item.x < zoneX + zoneWidth + 8 && item.x + item.width > zoneX,
    );
    if (!collides) {
      ctx.fillStyle = colors.text;
      ctx.textAlign = 'left';
      ctx.fillText(zone.label, zoneX, zoneY);
    }
  }

  placed.forEach((item) => {
    ctx.textAlign = 'left';
    ctx.lineWidth = 4;
    ctx.strokeStyle = colors.permukaan;
    ctx.fillStyle = item.label.color;
    ctx.font = item.nameFont;
    ctx.strokeText(item.name, item.x, item.y);
    ctx.fillText(item.name, item.x, item.y);
    ctx.font = item.amountFont;
    ctx.strokeText(item.label.amount, item.x + item.nameWidth, item.y);
    ctx.fillText(item.label.amount, item.x + item.nameWidth, item.y);
  });
  ctx.restore();
}

/**
 * Menggambar bagian grafik yang bergaya buku kas dan tidak ada di Chart.js: daerah "zona wajar" di bawah garis grid,
 * label langsung di ujung garis (pengganti legenda), serta penunjuk vertikal saat disentuh atau ditunjuk kursor.
 * Grafik tanpa konfigurasi (lihat `setBukuKasConfig`) tidak digambar apa-apa oleh plugin ini.
 */
export const bukuKasPlugin: Plugin<'line'> = {
  id: 'bukuKas',

  beforeDraw(chart) {
    const config = configs.get(chart.canvas);
    if (config) drawZone(chart, config);
  },

  afterDatasetsDraw(chart) {
    const config = configs.get(chart.canvas);
    if (!config) return;
    drawPointer(chart, config);
    drawLabels(chart, config);
  },

  afterEvent(chart, args) {
    const config = configs.get(chart.canvas);
    if (!config) return;
    const { event } = args;
    if (event.type === 'mouseout') {
      if (hover.get(chart) !== null && hover.has(chart)) {
        hover.set(chart, null);
        config.onActiveChange?.(null);
        args.changed = true;
      }
      return;
    }
    // Chart.js menerjemahkan sentuhan menjadi peristiwa mouse yang setara (touchstart jadi mousedown).
    if (event.type !== 'mousemove' && event.type !== 'mousedown' && event.type !== 'click') return;
    if (!args.inChartArea) return;
    const index = nearestIndex(chart, event);
    if (index === null || hover.get(chart) === index) return;
    hover.set(chart, index);
    config.onActiveChange?.(index);
    args.changed = true;
  },
};
