import styles from './ProductName.module.scss';

// Bagian seperti "+ Nasi" atau "(5 pcs)" dijaga tetap satu baris supaya nama panjang tidak pecah jelek.
const KEEP_TOGETHER = /(\+ \S+|\(\d+ \w+\))/;

/** Nama produk dengan titik pemisah baris yang rapi. Teks tetap utuh bagi pembaca layar. */
export function ProductName({ name }: { name: string }) {
  // split dengan grup penangkap menaruh bagian yang cocok di indeks ganjil.
  const parts = name.split(KEEP_TOGETHER);
  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <span key={index} className={styles.keep}>
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}
