import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import dashboardFixture from '@fixtures/getDashboard.json';
import trenFixture from '@fixtures/getTrenData.json';
import hargaFixture from '@fixtures/getHargaTerbaru.json';
import pengaturanFixture from '@fixtures/getPengaturan.json';
import riwayatFixture from '@fixtures/getRiwayat.json';
import addHargaFixture from '@fixtures/addHargaBahan.json';
import simpanFixture from '@fixtures/simpanKeRiwayat.json';

/** Sama dengan `VITE_API_URL` di konfigurasi tes (vite.config.ts). */
export const API_URL = 'https://api.test/exec';

export interface LoggedRequest {
  method: string;
  action: string;
  url: URL;
  contentType: string | null;
  body: Record<string, unknown> | null;
}

/** Semua permintaan yang diterima server tiruan, untuk diperiksa di tes. */
export const requestLog: LoggedRequest[] = [];

export function callsTo(action: string): LoggedRequest[] {
  return requestLog.filter((request) => request.action === action);
}

const READ_FIXTURES: Record<string, unknown> = {
  getDashboard: dashboardFixture,
  getTrenData: trenFixture,
  getHargaTerbaru: hargaFixture,
  getPengaturan: pengaturanFixture,
  getRiwayat: riwayatFixture,
  ping: { ok: true, data: { status: 'ok', waktu: '2026-10-03T00:00:00.000Z' } },
};

const WRITE_FIXTURES: Record<string, unknown> = {
  addHargaBahan: addHargaFixture,
  savePengaturan: pengaturanFixture,
  simpanKeRiwayat: simpanFixture,
};

type Responder = () => Response | Promise<Response>;

/** Respons pengganti per aksi. Permintaan tetap dicatat di `requestLog`. */
const overrides = new Map<string, Responder>();

/** Mengganti respons satu aksi saja untuk tes yang sedang berjalan. */
export function respondWith(action: string, responder: Responder): void {
  overrides.set(action, responder);
}

export function resetOverrides(): void {
  overrides.clear();
}

function unknownAction(action: string) {
  return { ok: false, error: `Aksi "${action}" tidak dikenal.` };
}

export const handlers = [
  http.get(API_URL, ({ request }) => {
    const url = new URL(request.url);
    const action = url.searchParams.get('action') ?? '';
    requestLog.push({ method: 'GET', action, url, contentType: null, body: null });
    const override = overrides.get(action);
    if (override) return override();
    return HttpResponse.json(READ_FIXTURES[action] ?? unknownAction(action));
  }),
  http.post(API_URL, async ({ request }) => {
    const body = JSON.parse(await request.text()) as Record<string, unknown>;
    const action = String(body.action ?? '');
    requestLog.push({
      method: 'POST',
      action,
      url: new URL(request.url),
      contentType: request.headers.get('content-type'),
      body,
    });
    const override = overrides.get(action);
    if (override) return override();
    return HttpResponse.json(WRITE_FIXTURES[action] ?? unknownAction(action));
  }),
];

export const server = setupServer(...handlers);
