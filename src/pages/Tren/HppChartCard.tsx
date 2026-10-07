import { useMemo, useState } from 'react';
import type { TrenData } from '@/api/types';
import { Card } from '@/components/Card';
import { ChartDataTable, type ChartDataRow } from '@/components/ChartDataTable';
import { ChartReading } from '@/components/ChartReading';
import { FormField } from '@/components/FormField';
import { LineChart, type Series } from '@/components/LineChart';
import { StatusMessage } from '@/components/StatusMessage';
import { TEXT, hppDefinition } from '@/constants/text';
import { formatDate, formatPercent, formatRupiah } from '@/utils/format';
import styles from './Tren.module.scss';

function lastValue(values: (number | null)[]): number | null {
  for (let i = values.length - 1; i >= 0; i -= 1) {
    const value = values[i];
    if (typeof value === 'number') return value;
  }
  return null;
}

function minus(a: number | null | undefined, b: number | null | undefined): number | null {
  return typeof a === 'number' && typeof b === 'number' ? a - b : null;
}

/** Grafik HPP per porsi beserta garis baseline dan dua ambang keputusan. */
export function HppChartCard({ data }: { data: TrenData }) {
  const [selectedId, setSelectedId] = useState('');
  const [active, setActive] = useState<number | null>(null);
  const product = data.produk.find((item) => item.id_produk === selectedId) ?? data.produk[0];

  const hpp = useMemo(() => (product ? (data.hpp[product.id_produk] ?? []) : []), [data, product]);
  const baseline = product?.hpp_baseline ?? 0;
  const naik = baseline * (1 + data.batas_naik_persen / 100);
  const promo = baseline * (1 - data.batas_turun_persen / 100);

  const series = useMemo<Series[]>(() => {
    if (!product) return [];
    const flat = (value: number) => data.dates.map(() => value);
    const naikText = formatPercent(data.batas_naik_persen, { signed: true });
    const promoText = formatPercent(-data.batas_turun_persen, { signed: true });
    // Garis ambang hanya untuk tampilan; keputusannya tetap dihitung backend.
    return [
      {
        label: `HPP (rata-rata ${data.periode_ma} hari)`,
        data: hpp,
        color: 'hpp',
        main: true,
        endLabel: { text: 'HPP', amount: formatRupiah(lastValue(hpp)) },
      },
      {
        label: 'HPP baseline',
        data: flat(baseline),
        color: 'baseline',
        dash: [7, 5],
        endLabel: { text: 'Baseline', amount: formatRupiah(baseline) },
      },
      {
        label: `Batas naik harga (${naikText})`,
        data: flat(naik),
        color: 'naik',
        endLabel: { text: `Batas naik ${naikText}`, amount: formatRupiah(naik) },
      },
      {
        label: `Batas promo (${promoText})`,
        data: flat(promo),
        color: 'promo',
        endLabel: { text: `Batas promo ${promoText}`, amount: formatRupiah(promo) },
      },
    ];
  }, [data, product, hpp, baseline, naik, promo]);

  const rows = useMemo<ChartDataRow[]>(
    () =>
      data.dates
        .map((date, index) => ({ date, value: hpp[index] ?? null, diff: minus(hpp[index], baseline) }))
        .reverse(),
    [data.dates, hpp, baseline],
  );

  if (!product) {
    return (
      <Card title="HPP per porsi" headingLevel={3}>
        <StatusMessage variant="empty">{TEXT.emptyTrenProduk}</StatusMessage>
      </Card>
    );
  }

  const index = active ?? data.dates.length - 1;
  const value = hpp[index] ?? null;

  return (
    <Card title={`HPP per porsi: ${product.nama_produk}`} headingLevel={3}>
      <div className={styles.picker}>
        <FormField label="Produk">
          {(field) => (
            <select
              {...field}
              value={product.id_produk}
              onChange={(event) => {
                setSelectedId(event.target.value);
                setActive(null);
              }}
            >
              {data.produk.map((item) => (
                <option key={item.id_produk} value={item.id_produk}>
                  {item.nama_produk}
                </option>
              ))}
            </select>
          )}
        </FormField>
      </div>
      <ChartReading>
        <span>{formatDate(data.dates[index])}</span>
        <span>
          HPP <b>{formatRupiah(value)}</b>
        </span>
        <span>baseline {formatRupiah(baseline)}</span>
        <span>
          selisih <b>{formatRupiah(minus(value, baseline), { signed: true })}</b>
        </span>
      </ChartReading>
      <LineChart
        dates={data.dates}
        series={series}
        zone={{ from: promo, to: naik, label: TEXT.zoneLabel }}
        onActiveChange={setActive}
        description={`Grafik HPP per porsi ${product.nama_produk} dibanding baseline dan batas keputusan`}
      />
      <p className={styles.note}>
        {TEXT.trenHppNote} {hppDefinition(data.periode_ma)}
      </p>
      <ChartDataTable
        rows={rows}
        caption={`Data HPP per porsi ${product.nama_produk}`}
        valueHeader="HPP"
        diffHeader="Selisih dari baseline"
      />
    </Card>
  );
}
