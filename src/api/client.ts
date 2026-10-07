/**
 * Klien fetch untuk Web App Google Apps Script.
 *
 * Menangani jebakan Apps Script yang dijelaskan di docs/02-kontrak-api.md:
 * - POST memakai `text/plain` agar browser tidak mengirim preflight OPTIONS
 * - galat ditandai `{ok:false}` di body, bukan lewat status HTTP
 * - respons bisa berupa halaman HTML login Google, bukan JSON
 * - redirect ke script.googleusercontent.com diikuti otomatis oleh fetch
 * - respons lambat, jadi ada batas waktu 30 detik
 */

export type ApiErrorKind = 'config' | 'network' | 'timeout' | 'parse' | 'invalid' | 'server';

export const ERROR_MESSAGES: Record<Exclude<ApiErrorKind, 'server'>, string> = {
  config: 'URL API belum diisi. Salin .env.example menjadi .env lalu isi VITE_API_URL.',
  network: 'Tidak dapat terhubung ke server. Periksa koneksi internet dan URL API.',
  timeout: 'Server terlalu lama merespons. Coba lagi.',
  parse: 'Respons dari server bukan JSON. Pastikan Web App di-deploy dengan akses Anyone dan URL di .env benar.',
  invalid: 'Format respons dari server tidak dikenali.',
};

const SERVER_FALLBACK = 'Terjadi kesalahan di server.';

export class ApiError extends Error {
  readonly kind: ApiErrorKind;

  constructor(kind: ApiErrorKind, message: string) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
  }
}

export const DEFAULT_TIMEOUT_MS = 30_000;

export interface ClientConfig {
  url: string;
  key: string;
  timeoutMs?: number;
}

export type QueryParams = Record<string, string | number | undefined>;

export interface ApiClient {
  get<T>(action: string, params?: QueryParams): Promise<T>;
  post<T>(action: string, payload: unknown): Promise<T>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseBody<T>(text: string): T {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new ApiError('parse', ERROR_MESSAGES.parse);
  }
  if (!isRecord(json) || typeof json.ok !== 'boolean') {
    throw new ApiError('invalid', ERROR_MESSAGES.invalid);
  }
  if (json.ok === false) {
    const message = typeof json.error === 'string' && json.error.trim() !== '' ? json.error : SERVER_FALLBACK;
    throw new ApiError('server', message);
  }
  return json.data as T;
}

function errorName(error: unknown): string {
  return isRecord(error) && typeof error.name === 'string' ? error.name : '';
}

export function createClient(config: ClientConfig): ApiClient {
  const url = config.url.trim();
  const key = config.key.trim();
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  // GET identik yang sedang berjalan dipakai bersama, jadi dua komponen (atau efek ganda
  // StrictMode) yang meminta data sama hanya menghasilkan satu permintaan jaringan.
  const inflight = new Map<string, Promise<unknown>>();

  async function request<T>(target: string, init: RequestInit): Promise<T> {
    // Diperiksa sebelum fetch agar tidak ada permintaan jaringan sama sekali.
    if (url === '') throw new ApiError('config', ERROR_MESSAGES.config);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(target, { ...init, signal: controller.signal });
      const text = await response.text();
      return parseBody<T>(text);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      const name = errorName(error);
      // Dicek lewat `name`, bukan `instanceof`, karena kelas galat bisa berbeda antar-realm.
      if (name === 'AbortError' || name === 'TimeoutError') throw new ApiError('timeout', ERROR_MESSAGES.timeout);
      // `fetch` melempar TypeError saat koneksi gagal (termasuk diblokir CORS). Galat lain yang
      // tidak dikenal dari lapisan jaringan juga diperlakukan sama.
      throw new ApiError('network', ERROR_MESSAGES.network);
    } finally {
      clearTimeout(timer);
    }
  }

  return {
    get<T>(action: string, params: QueryParams = {}): Promise<T> {
      const query = new URLSearchParams({ action });
      for (const [name, value] of Object.entries(params)) {
        if (value !== undefined) query.set(name, String(value));
      }
      if (key !== '') query.set('key', key);
      const target = url + (url.includes('?') ? '&' : '?') + query.toString();

      const existing = inflight.get(target);
      if (existing) return existing as Promise<T>;
      const promise = request<T>(target, { method: 'GET' }).finally(() => inflight.delete(target));
      inflight.set(target, promise);
      return promise;
    },

    post<T>(action: string, payload: unknown): Promise<T> {
      const body: Record<string, unknown> = { action, payload };
      if (key !== '') body.key = key;
      return request<T>(url, {
        method: 'POST',
        // text/plain menghindari preflight CORS yang tidak didukung Apps Script.
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body),
      });
    },
  };
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return SERVER_FALLBACK;
}
