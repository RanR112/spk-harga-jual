export interface TabItem {
  id: string;
  to: string;
  label: string;
}

export const TABS: TabItem[] = [
  { id: 'tab-dashboard', to: '/', label: 'Dashboard' },
  { id: 'tab-tren', to: '/tren', label: 'Tren harga' },
  { id: 'tab-input', to: '/input', label: 'Input harga' },
  { id: 'tab-pengaturan', to: '/pengaturan', label: 'Pengaturan' },
  { id: 'tab-riwayat', to: '/riwayat', label: 'Riwayat' },
];

export function activeTab(pathname: string): TabItem | undefined {
  return TABS.find((tab) => tab.to === pathname);
}
