import type { Rekomendasi } from '@/api/types';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { KEPUTUSAN_LABEL, TEXT } from '@/constants/text';
import { formatPercent, formatRupiah } from '@/utils/format';
import { RincianTable } from './RincianTable';
import styles from './ProductDialog.module.scss';

interface ProductDialogProps {
  item: Rekomendasi;
  onClose: () => void;
}

interface Fact {
  label: string;
  value: string;
  /** Nama kelas warna untuk nilai (mengikuti keputusan). */
  tone?: string;
}

/** Bagian "Perbandingan": angka pendukung yang tidak muat di baris tabel utama. */
function facts(item: Rekomendasi): Fact[] {
  const tone = styles[KEPUTUSAN_LABEL[item.keputusan]?.key ?? 'data'];
  const list: Fact[] = [
    { label: 'HPP baseline', value: formatRupiah(item.hpp_baseline) },
    { label: 'HPP sekarang', value: formatRupiah(item.hpp) },
    { label: 'Perubahan HPP', value: formatPercent(item.perubahan_persen, { signed: true }), tone },
    {
      label: 'Margin awal → sekarang',
      value: `${formatPercent(item.margin_awal_persen)} → ${formatPercent(item.margin_persen)}`,
    },
    { label: 'Harga jual sekarang', value: formatRupiah(item.harga_jual) },
  ];
  if (item.keputusan === 'NAIKKAN HARGA') {
    list.push({ label: 'Harga saran', value: formatRupiah(item.harga_saran) });
    list.push({ label: 'Kenaikan', value: formatRupiah(item.kenaikan_rp, { signed: true }) });
  }
  if (item.keputusan === 'BERI PROMO') {
    list.push({ label: 'Diskon aman maks', value: formatPercent(item.diskon_maks_persen) });
    list.push({ label: 'Hemat per porsi', value: formatRupiah(item.hemat_per_porsi) });
  }
  return list;
}

export function ProductDialog({ item, onClose }: ProductDialogProps) {
  return (
    <Modal title={item.nama_produk} titleAddon={<Badge keputusan={item.keputusan} large />} onClose={onClose}>
      <div className={styles.content}>
        <section aria-labelledby="dialog-perbandingan">
          <h3 id="dialog-perbandingan" className={styles.small}>
            Perbandingan
          </h3>
          <dl className={styles.facts}>
            {facts(item).map((fact) => (
              <div key={fact.label}>
                <dt>{fact.label}</dt>
                <i aria-hidden="true" />
                <dd className={fact.tone}>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="dialog-keterangan">
          <h3 id="dialog-keterangan" className={styles.small}>
            Keterangan
          </h3>
          {item.keterangan && <p className={styles.note}>{item.keterangan}</p>}
          {item.rincian.length === 0 ? (
            <p className={styles.empty}>{TEXT.emptyRincian}</p>
          ) : (
            <RincianTable caption={`Rincian bahan ${item.nama_produk}`} rows={item.rincian} total={item.hpp} />
          )}
        </section>
      </div>
    </Modal>
  );
}
