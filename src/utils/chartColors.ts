/**
 * Warna dan font grafik dibaca dari variabel CSS yang diisi dari token SCSS di global.scss,
 * jadi tidak ada heksadesimal di komponen dan warna ikut berubah saat tema berganti.
 */
export interface ChartColors {
  hpp: string;
  baseline: string;
  naik: string;
  promo: string;
  bahan: string;
  grid: string;
  text: string;
  /** Daerah "zona wajar" di antara batas promo dan batas naik. */
  zona: string;
  /** Warna latar grafik, dipakai untuk bingkai di sekeliling teks dan isi penanda titik. */
  permukaan: string;
  font: string;
  mono: string;
}

const VARIABLES: Record<keyof ChartColors, string> = {
  hpp: '--chart-hpp',
  baseline: '--chart-baseline',
  naik: '--chart-naik',
  promo: '--chart-promo',
  bahan: '--chart-bahan',
  grid: '--chart-grid',
  text: '--chart-text',
  zona: '--chart-zona',
  permukaan: '--chart-permukaan',
  font: '--font-teks',
  mono: '--font-angka',
};

export function readChartColors(element: Element = document.documentElement): ChartColors {
  const style = getComputedStyle(element);
  const entries = Object.entries(VARIABLES).map(([name, variable]) => [name, style.getPropertyValue(variable).trim()]);
  return Object.fromEntries(entries) as ChartColors;
}
