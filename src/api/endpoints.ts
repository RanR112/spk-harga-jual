import { createClient, type ApiClient } from './client';
import type {
  AddHargaPayload,
  AddHargaResult,
  DashboardData,
  InputHarga,
  Pengaturan,
  PingResult,
  RiwayatRow,
  SimpanRiwayatResult,
  TrenData,
} from './types';

/** Semua aksi backend. Aksi baca lewat GET, aksi tulis lewat POST (docs/02 bagian daftar endpoint). */
export interface Api {
  ping(): Promise<PingResult>;
  getDashboard(): Promise<DashboardData>;
  getTrenData(days?: number): Promise<TrenData>;
  getHargaTerbaru(limit?: number): Promise<InputHarga[]>;
  getPengaturan(): Promise<Pengaturan>;
  getRiwayat(limit?: number): Promise<RiwayatRow[]>;
  addHargaBahan(payload: AddHargaPayload): Promise<AddHargaResult>;
  savePengaturan(payload: Pengaturan): Promise<Pengaturan>;
  simpanKeRiwayat(): Promise<SimpanRiwayatResult>;
}

export const DEFAULT_TREN_DAYS = 60;
export const DEFAULT_HARGA_LIMIT = 15;
export const DEFAULT_RIWAYAT_LIMIT = 300;

export function createHttpApi(client: ApiClient): Api {
  return {
    ping: () => client.get<PingResult>('ping'),
    getDashboard: () => client.get<DashboardData>('getDashboard'),
    getTrenData: (days = DEFAULT_TREN_DAYS) => client.get<TrenData>('getTrenData', { days }),
    getHargaTerbaru: (limit = DEFAULT_HARGA_LIMIT) => client.get<InputHarga[]>('getHargaTerbaru', { limit }),
    getPengaturan: () => client.get<Pengaturan>('getPengaturan'),
    getRiwayat: (limit = DEFAULT_RIWAYAT_LIMIT) => client.get<RiwayatRow[]>('getRiwayat', { limit }),
    addHargaBahan: (payload) => client.post<AddHargaResult>('addHargaBahan', payload),
    savePengaturan: (payload) => client.post<Pengaturan>('savePengaturan', payload),
    simpanKeRiwayat: () => client.post<SimpanRiwayatResult>('simpanKeRiwayat', null),
  };
}

/**
 * Mode demo aktif saat `VITE_API_URL` kosong. Data diambil dari docs/fixtures lewat
 * import dinamis, jadi tidak ada permintaan ke server API dan fixture tidak ikut
 * membebani bundel utama saat API asli dipakai.
 */
function createLazyDemoApi(): Api {
  const load = () => import('./demoApi').then((module) => module.demoApi);
  return {
    ping: () => load().then((demo) => demo.ping()),
    getDashboard: () => load().then((demo) => demo.getDashboard()),
    getTrenData: (days) => load().then((demo) => demo.getTrenData(days)),
    getHargaTerbaru: (limit) => load().then((demo) => demo.getHargaTerbaru(limit)),
    getPengaturan: () => load().then((demo) => demo.getPengaturan()),
    getRiwayat: (limit) => load().then((demo) => demo.getRiwayat(limit)),
    addHargaBahan: (payload) => load().then((demo) => demo.addHargaBahan(payload)),
    savePengaturan: (payload) => load().then((demo) => demo.savePengaturan(payload)),
    simpanKeRiwayat: () => load().then((demo) => demo.simpanKeRiwayat()),
  };
}

const API_URL = (import.meta.env.VITE_API_URL ?? '').trim();
const API_KEY = (import.meta.env.VITE_API_KEY ?? '').trim();

export const isDemoMode = API_URL === '';

export const api: Api = isDemoMode ? createLazyDemoApi() : createHttpApi(createClient({ url: API_URL, key: API_KEY }));
