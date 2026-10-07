/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' agar hasil build bisa dibuka dari subfolder GitHub Pages tanpa konfigurasi.
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@fixtures': fileURLToPath(new URL('./docs/fixtures', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
    // URL palsu untuk tes; MSW mencegat semua permintaan ke alamat ini.
    env: { VITE_API_URL: 'https://api.test/exec', VITE_API_KEY: '' },
  },
});
