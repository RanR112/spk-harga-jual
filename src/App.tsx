import type { ReactNode } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { DashboardProvider } from './context/DashboardProvider';
import { RefreshProvider } from './context/RefreshProvider';
import { ToastProvider } from './context/ToastProvider';
import { Dashboard } from './pages/Dashboard/Dashboard';
import { InputHarga } from './pages/InputHarga/InputHarga';
import { Pengaturan } from './pages/Pengaturan/Pengaturan';
import { Riwayat } from './pages/Riwayat/Riwayat';
import { Tren } from './pages/Tren/Tren';

/** Penyedia state bersama. Dipisah dari router agar tes bisa memakai MemoryRouter. */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <RefreshProvider>
      <ToastProvider>
        <DashboardProvider>{children}</DashboardProvider>
      </ToastProvider>
    </RefreshProvider>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="tren" element={<Tren />} />
        <Route path="input" element={<InputHarga />} />
        <Route path="pengaturan" element={<Pengaturan />} />
        <Route path="riwayat" element={<Riwayat />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export function App() {
  return (
    // HashRouter agar jalan di GitHub Pages tanpa konfigurasi server.
    <HashRouter>
      <AppProviders>
        <AppRoutes />
      </AppProviders>
    </HashRouter>
  );
}
