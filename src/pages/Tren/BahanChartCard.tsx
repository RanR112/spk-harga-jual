import { useMemo, useState } from 'react';
import type { TrenData } from '@/api/types';
import { Card } from '@/components/Card';
import { ChartDataTable, type ChartDataRow } from '@/components/ChartDataTable';
import { ChartReading } from '@/components/ChartReading';
import { FormField } from '@/components/FormField';
import { LineChart, type Series } from '@/components/LineChart';
import { StatusMessage } from '@/components/StatusMessage';
import { TEXT } from '@/constants/text';
import { formatDate, formatRupiah } from '@/utils/format';
import styles from './Tren.module.scss';

function firstValue(values: (number | null)[]): number | null {
  for (const value of values) {
    if (typeof value === 'number') return value;
  }
  return null;
}

function lastValue(values: (number | null)[]): number | null {
  return firstValue([...values].reverse());
}

function minus(a: number | null | undefined, b: number | null | undefined): number | null {
  return typeof a === 'number' && typeof b === 'number' ? a - b : null;
}

/** Grafik harga satu bahan pokok, dengan garis putus-putus harga di awal periode sebagai pembanding. */
export function BahanChartCard({ data }: { data: TrenData }) {
  const names = useMemo(() => Object.keys(data.bahan).sort((a, b) => a.localeCompare(b, 'id')), [data.bahan]);
  const [selected, setSelected] = useState('');
  const [active, setActive] = useState<number | null>(null);
  const name = names.includes(selected) ? selected : names[0];
  const bahan = name ? data.bahan[name] : undefined;
  const values = useMemo(() => bahan?.values ?? [], [bahan]);
  const start = firstValue(values);

  const series = useMemo<Series[]>(() => {
    if (!name || !bahan) return [];
    return [
      {
        label: `${name} (per ${bahan.satuan})`,
        data: bahan.values,
        color: 'bahan',
        main: true,
        endLabel: { text: name, amount: formatRupiah(lastValue(bahan.values)) },
      },
      {
        label: 'Harga awal periode',
        data: bahan.values.map(() => start),
        color: 'baseline',
        dash: [7, 5],
        endLabel: { text: 'Awal', amount: formatRupiah(start) },
      },
    ];
  }, [name, bahan, start]);

  const rows = useMemo<ChartDataRow[]>(
    () =>
      data.dates
        .map((date, index) => ({
          date,
          value: values[index] ?? null,
          diff: index === 0 ? null : minus(values[index], values[index - 1]),
        }))
        .reverse(),
    [data.dates, values],
  );

  if (!name || !bahan) {
    return (
      <Card title="Harga bahan pokok" headingLevel={3}>
        <StatusMessage variant="empty">{TEXT.emptyBahan}</StatusMessage>
      </Card>
    );
  }

  const index = active ?? data.dates.length - 1;
  const value = values[index] ?? null;

  return (
    <Card title={`Harga bahan pokok: ${name}`} headingLevel={3}>
      <div className={styles.picker}>
        <FormField label="Bahan">
          {(field) => (
            <select
              {...field}
              value={name}
              onChange={(event) => {
                setSelected(event.target.value);
                setActive(null);
              }}
            >
              {names.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          )}
        </FormField>
      </div>
      <ChartReading>
        <span>{formatDate(data.dates[index])}</span>
        <span>
          {name} <b>{formatRupiah(value)}</b>/{bahan.satuan}
        </span>
        <span>
          selisih dari awal <b>{formatRupiah(minus(value, start), { signed: true })}</b>
        </span>
      </ChartReading>
      <LineChart
        dates={data.dates}
        series={series}
        onActiveChange={setActive}
        description={`Grafik harga ${name} per ${bahan.satuan}`}
      />
      <p className={styles.note}>{TEXT.trenBahanNote}</p>
      <ChartDataTable
        rows={rows}
        caption={`Data harga ${name}`}
        valueHeader={`Harga/${bahan.satuan}`}
        diffHeader="Beda dari hari sebelumnya"
      />
    </Card>
  );
}
