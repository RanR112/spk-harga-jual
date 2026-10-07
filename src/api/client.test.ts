import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { API_URL, callsTo, server } from '@/test/server';
import { ApiError, ERROR_MESSAGES, createClient } from './client';
import { createHttpApi } from './endpoints';

function client(overrides: { url?: string; key?: string; timeoutMs?: number } = {}) {
  return createClient({ url: API_URL, key: '', ...overrides });
}

async function rejection(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof ApiError) return error;
    throw error;
  }
  throw new Error('Permintaan seharusnya gagal.');
}

describe('createClient', () => {
  it('mengembalikan field data dari respons sukses lewat GET', async () => {
    const data = await createHttpApi(client()).getDashboard();
    expect(data.rekomendasi.ringkasan.total).toBe(9);
    expect(callsTo('getDashboard')[0]?.method).toBe('GET');
  });

  it('mengirim parameter angka di query string', async () => {
    await createHttpApi(client()).getTrenData();
    expect(callsTo('getTrenData')[0]?.url.searchParams.get('days')).toBe('60');
  });

  it('memakai POST dengan Content-Type text/plain dan body JSON', async () => {
    const payload = { tanggal: '2026-10-03', bahan: 'Telur ayam', harga: 36000 };
    await createHttpApi(client()).addHargaBahan(payload);
    const [request] = callsTo('addHargaBahan');
    expect(request?.method).toBe('POST');
    expect(request?.contentType).toBe('text/plain;charset=utf-8');
    expect(request?.body).toEqual({ action: 'addHargaBahan', payload });
  });

  it('tidak mengirim key saat VITE_API_KEY kosong', async () => {
    const api = createHttpApi(client({ key: '' }));
    await api.getPengaturan();
    await api.simpanKeRiwayat();
    expect(callsTo('getPengaturan')[0]?.url.searchParams.has('key')).toBe(false);
    expect(callsTo('simpanKeRiwayat')[0]?.body).not.toHaveProperty('key');
  });

  it('mengirim key saat diisi', async () => {
    const api = createHttpApi(client({ key: 'rahasia' }));
    await api.getPengaturan();
    await api.simpanKeRiwayat();
    expect(callsTo('getPengaturan')[0]?.url.searchParams.get('key')).toBe('rahasia');
    expect(callsTo('simpanKeRiwayat')[0]?.body).toMatchObject({ key: 'rahasia', payload: null });
  });

  it('menampilkan pesan server apa adanya untuk {ok:false} walau HTTP 200', async () => {
    server.use(http.get(API_URL, () => HttpResponse.json({ ok: false, error: 'Harga harus lebih dari 0.' })));
    const error = await rejection(client().get('getDashboard'));
    expect(error.kind).toBe('server');
    expect(error.message).toBe('Harga harus lebih dari 0.');
  });

  it('mengenali respons HTML (halaman login Google)', async () => {
    server.use(http.get(API_URL, () => HttpResponse.html('<!doctype html><html><body>Sign in</body></html>')));
    const error = await rejection(client().get('getDashboard'));
    expect(error.kind).toBe('parse');
    expect(error.message).toBe(ERROR_MESSAGES.parse);
  });

  it('mengenali JSON yang bukan bentuk respons API', async () => {
    server.use(http.get(API_URL, () => HttpResponse.json([1, 2, 3])));
    const error = await rejection(client().get('getDashboard'));
    expect(error.kind).toBe('invalid');
  });

  it('mengenali jaringan putus', async () => {
    server.use(http.get(API_URL, () => HttpResponse.error()));
    const error = await rejection(client().get('getDashboard'));
    expect(error.kind).toBe('network');
    expect(error.message).toBe(ERROR_MESSAGES.network);
  });

  it('membatalkan permintaan yang melewati batas waktu', async () => {
    server.use(
      http.get(API_URL, async () => {
        await delay('infinite');
        return HttpResponse.json({ ok: true, data: null });
      }),
    );
    const error = await rejection(client({ timeoutMs: 50 }).get('getDashboard'));
    expect(error.kind).toBe('timeout');
    expect(error.message).toBe(ERROR_MESSAGES.timeout);
  });

  it('memakai batas waktu bawaan 30 detik', async () => {
    const timeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    try {
      await client().get('ping');
      expect(timeoutSpy).toHaveBeenCalledWith(expect.any(Function), 30_000);
    } finally {
      timeoutSpy.mockRestore();
    }
  });

  it('tidak memanggil jaringan sama sekali saat URL kosong', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    try {
      const error = await rejection(client({ url: '' }).get('getDashboard'));
      expect(error.kind).toBe('config');
      expect(error.message).toBe(ERROR_MESSAGES.config);
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('menghasilkan pesan berbeda untuk tiap jenis galat', () => {
    const messages = Object.values(ERROR_MESSAGES);
    expect(new Set(messages).size).toBe(messages.length);
  });

  it('menggabungkan GET identik yang berjalan bersamaan menjadi satu permintaan', async () => {
    const api = createHttpApi(client());
    await Promise.all([api.getDashboard(), api.getDashboard()]);
    expect(callsTo('getDashboard')).toHaveLength(1);
  });
});
