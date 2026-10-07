import type { KeputusanKey } from '@/constants/text';

/** Penanda bentuk keputusan: segitiga naik, segitiga turun, lingkaran, tanda seru. Mengikuti warna teks. */
export function KeputusanIcon({ name, className }: { name: KeputusanKey; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 12 12" fill="currentColor" aria-hidden="true" focusable="false">
      {name === 'naik' && <path d="M6 1.5 11.2 10.5H.8z" />}
      {name === 'promo' && <path d="M6 10.5 11.2 1.5H.8z" />}
      {name === 'tahan' && <circle cx="6" cy="6" r="4.5" />}
      {name === 'data' && (
        <>
          <rect x="5" y="1" width="2" height="6.5" />
          <circle cx="6" cy="10" r="1.3" />
        </>
      )}
    </svg>
  );
}
