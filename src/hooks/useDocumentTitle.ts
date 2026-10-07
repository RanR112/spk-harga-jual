import { useEffect } from 'react';

const APP_NAME = 'SPK Harga Jual';

export function useDocumentTitle(page: string): void {
  useEffect(() => {
    document.title = page ? `${page} · ${APP_NAME}` : APP_NAME;
  }, [page]);
}
