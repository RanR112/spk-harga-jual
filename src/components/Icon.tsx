export type IconName = 'panah' | 'muat' | 'simpan' | 'centang' | 'seru' | 'buku' | 'matahari' | 'bulan' | 'merek';

interface IconProps {
  name: IconName;
  /** Ukuran sisi dalam piksel. */
  size?: number;
  className?: string;
}

const VIEWBOX: Record<IconName, number> = {
  panah: 16,
  muat: 24,
  simpan: 24,
  centang: 24,
  seru: 24,
  buku: 40,
  matahari: 24,
  bulan: 24,
  merek: 44,
};

const STROKE: Record<IconName, number> = {
  panah: 2,
  muat: 2,
  simpan: 2,
  centang: 2.4,
  seru: 2.2,
  buku: 2.2,
  matahari: 2,
  bulan: 2,
  merek: 2,
};

function Paths({ name }: { name: IconName }) {
  switch (name) {
    case 'panah':
      return <path d="M5.5 3l5 5-5 5" />;
    case 'muat':
      return (
        <>
          <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
          <path d="M21 3v5h-5" />
        </>
      );
    case 'simpan':
      return (
        <>
          <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22.5z" />
          <path d="M4 19.5V4.5" />
          <path d="M9 7h6M9 11h6" />
        </>
      );
    case 'centang':
      return <path d="M4 12.5 9.5 18 20 6.5" />;
    case 'seru':
      return (
        <>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 7v6M12 16.5v.5" />
        </>
      );
    case 'buku':
      return (
        <>
          <rect x="6" y="4" width="28" height="32" rx="3" />
          <path d="M13 4v32M19 13h10M19 20h10M19 27h6" />
        </>
      );
    case 'matahari':
      return (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </>
      );
    case 'bulan':
      return <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />;
    case 'merek':
      return (
        <>
          <rect x="5" y="4" width="34" height="36" rx="3" strokeWidth="2.5" />
          <path d="M13 4v36" strokeWidth="2.5" />
          <path d="M19 14h14M19 21h14M19 28h9" />
        </>
      );
  }
}

/** Ikon garis sederhana (stroke mengikuti warna teks). Semuanya dekoratif, jadi disembunyikan dari pembaca layar. */
export function Icon({ name, size = 18, className }: IconProps) {
  const box = VIEWBOX[name];
  return (
    <svg
      className={className}
      viewBox={`0 0 ${box} ${box}`}
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={STROKE[name]}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <Paths name={name} />
    </svg>
  );
}
