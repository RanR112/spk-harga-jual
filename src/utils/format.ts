/**
 * Helper format tampilan. Semua fungsi menerima nilai yang mungkin `null`/`undefined`
 * dan mengembalikan `-` untuk nilai yang tidak bisa ditampilkan, sehingga `NaN`,
 * `undefined`, atau `null` tidak pernah sampai ke layar.
 */

export const EMPTY = '-';

const LOCALE = 'id-ID';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const integerFormat = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });
const percentFormat = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const decimalFormat = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 3 });

function isNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function sign(value: number): string {
  if (value > 0) return '+';
  if (value < 0) return '-';
  return '';
}

/** `14302` → `Rp14.302`. Dengan `signed`, `4500` → `+Rp4.500`. */
export function formatRupiah(value: number | null | undefined, options: { signed?: boolean } = {}): string {
  if (!isNumber(value)) return EMPTY;
  const rounded = Math.round(value);
  const body = 'Rp' + integerFormat.format(Math.abs(rounded));
  if (options.signed) return sign(rounded) + body;
  return (rounded < 0 ? '-' : '') + body;
}

/**
 * Persen dari API sudah berupa angka biasa (`13.8` berarti 13,8%).
 * `13.8` → `13,8%`. Dengan `signed`, `13.8` → `+13,8%` dan `-15.7` → `-15,7%`.
 */
export function formatPercent(value: number | null | undefined, options: { signed?: boolean } = {}): string {
  if (!isNumber(value)) return EMPTY;
  const body = percentFormat.format(Math.abs(value)) + '%';
  // Nilai yang membulat ke 0,0 tidak diberi tanda.
  const isZero = body === percentFormat.format(0) + '%';
  if (options.signed) return (isZero ? '' : sign(value)) + body;
  return (value < 0 && !isZero ? '-' : '') + body;
}

/** Angka biasa dengan maksimal 3 desimal, misalnya takaran `0.15` → `0,15`. */
export function formatNumber(value: number | null | undefined): string {
  if (!isNumber(value)) return EMPTY;
  return decimalFormat.format(value);
}

function parseIsoDate(value: string | null | undefined): { year: number; month: number; day: number } | null {
  if (typeof value !== 'string') return null;
  // Dipotong ke 10 karakter agar timestamp ISO juga diterima. Tidak memakai `new Date()`
  // supaya tanggal tidak bergeser karena zona waktu.
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

/** `2026-10-02` → `2 Okt 2026`. */
export function formatDate(value: string | null | undefined): string {
  const date = parseIsoDate(value);
  if (!date) return EMPTY;
  return `${date.day} ${MONTHS_SHORT[date.month - 1]} ${date.year}`;
}

/** `2026-09-03` → `3 Sep`, untuk sumbu grafik. */
export function formatDateShort(value: string | null | undefined): string {
  const date = parseIsoDate(value);
  if (!date) return EMPTY;
  return `${date.day} ${MONTHS_SHORT[date.month - 1]}`;
}

/** Tanggal hari ini dalam zona waktu lokal, format `YYYY-MM-DD` untuk `<input type="date">`. */
export function todayIso(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
