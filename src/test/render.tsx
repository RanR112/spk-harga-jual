import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppProviders, AppRoutes } from '@/App';

/** Merender aplikasi utuh (header, tab, toast, halaman) pada rute tertentu. */
export function renderApp(route = '/') {
  const user = userEvent.setup();
  const result = render(
    <MemoryRouter initialEntries={[route]}>
      <AppProviders>
        <AppRoutes />
      </AppProviders>
    </MemoryRouter>,
  );
  return { user, ...result };
}

/** Teks yang tidak boleh pernah muncul di layar. */
export const FORBIDDEN_TEXT = /NaN|undefined|null|\[object Object\]/;
