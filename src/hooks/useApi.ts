import { useCallback, useEffect, useMemo, useState } from 'react';
import { errorMessage } from '@/api/client';
import { useRefresh } from '@/context/refreshContext';

export interface ApiState<T> {
  /** Data terakhir yang berhasil dimuat. Tetap ada selama memuat ulang agar layar tidak berkedip. */
  data: T | null;
  /** Pesan galat siap tampil, atau `null`. Selalu `null` selama permintaan baru berjalan. */
  error: string | null;
  loading: boolean;
  reload: () => void;
}

interface Request<T> {
  fetcher: () => Promise<T>;
}

interface Result<T> {
  request: Request<T>;
  data: T | null;
  error: string | null;
}

/**
 * Memanggil `fetcher` saat komponen dipasang, saat `fetcher` berganti, saat `reload()`
 * dipanggil, dan saat tombol "Muat ulang" global ditekan.
 *
 * `fetcher` harus stabil (fungsi di luar komponen atau dibungkus `useCallback`),
 * kalau tidak permintaan akan diulang di setiap render.
 */
export function useApi<T>(fetcher: () => Promise<T>): ApiState<T> {
  const { refreshCount } = useRefresh();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result<T> | null>(null);

  // Satu objek per permintaan. Hasil yang datang terlambat dari permintaan lama diabaikan.
  // `attempt` dan `refreshCount` sengaja menjadi dependensi agar objek baru dibuat.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const request = useMemo<Request<T>>(() => ({ fetcher }), [fetcher, attempt, refreshCount]);

  useEffect(() => {
    let active = true;
    request.fetcher().then(
      (data) => {
        if (active) setResult({ request, data, error: null });
      },
      (error: unknown) => {
        if (active) setResult((previous) => ({ request, data: previous?.data ?? null, error: errorMessage(error) }));
      },
    );
    return () => {
      active = false;
    };
  }, [request]);

  const reload = useCallback(() => setAttempt((count) => count + 1), []);
  const loading = result?.request !== request;

  return {
    data: result?.data ?? null,
    error: loading ? null : (result?.error ?? null),
    loading,
    reload,
  };
}
