import type { BahanInfo } from '@/api/types';
import { Card } from '@/components/Card';
import { KeputusanIcon } from '@/components/KeputusanIcon';
import { StatusMessage } from '@/components/StatusMessage';
import { TEXT } from '@/constants/text';
import { formatPercent, formatRupiah } from '@/utils/format';
import styles from './MovingIngredients.module.scss';

const LIMIT = 6;

/** Naik buruk bagi margin (warna naik), turun baik (warna promo), perubahan di bawah 0,05% dianggap tidak bergerak. */
function direction(change: number | null): { icon: 'naik' | 'promo' | null; tone: string } {
  if (change === null || Math.abs(change) < 0.05) return { icon: null, tone: styles.flat ?? '' };
  if (change > 0) return { icon: 'naik', tone: styles.up ?? '' };
  return { icon: 'promo', tone: styles.down ?? '' };
}

/** Enam bahan dengan perubahan harga terbesar, naik maupun turun. */
export function MovingIngredients({ bahan }: { bahan: BahanInfo[] }) {
  const top = [...bahan]
    .sort((a, b) => Math.abs(b.perubahan_persen ?? 0) - Math.abs(a.perubahan_persen ?? 0))
    .slice(0, LIMIT);

  return (
    <Card title={TEXT.movingTitle} footer={TEXT.movingNote}>
      {top.length === 0 ? (
        <StatusMessage variant="empty">{TEXT.emptyBahan}</StatusMessage>
      ) : (
        <table className={styles.table}>
          <caption className="visually-hidden">Enam bahan dengan perubahan harga terbesar</caption>
          <thead>
            <tr>
              <th scope="col">Bahan</th>
              <th scope="col" className={styles.num}>
                Harga terakhir
              </th>
              <th scope="col" className={styles.num}>
                Perubahan
              </th>
            </tr>
          </thead>
          <tbody>
            {top.map((item) => {
              const { icon, tone } = direction(item.perubahan_persen);
              return (
                <tr key={item.nama}>
                  <td className={styles.name}>{item.nama}</td>
                  <td className={styles.num}>
                    {formatRupiah(item.harga_terakhir)}
                    <span className={styles.unit}>/{item.satuan}</span>
                  </td>
                  <td className={styles.num}>
                    <span className={`${styles.change} ${tone}`}>
                      {icon && <KeputusanIcon name={icon} />}
                      {formatPercent(item.perubahan_persen, { signed: true })}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Card>
  );
}
