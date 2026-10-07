import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/ibm-plex-sans/latin-400.css';
import '@fontsource/ibm-plex-sans/latin-500.css';
import '@fontsource/ibm-plex-sans/latin-600.css';
import '@fontsource/ibm-plex-sans/latin-700.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import '@fontsource/ibm-plex-mono/latin-600.css';
import '@fontsource/ibm-plex-mono/latin-700.css';
import { App } from './App';
import { initTheme } from './utils/theme';
import './styles/global.scss';

// Sebelum render pertama, agar tema tersimpan langsung terpasang tanpa kilatan.
initTheme();

const root = document.getElementById('root');
if (!root) throw new Error('Elemen #root tidak ditemukan.');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
