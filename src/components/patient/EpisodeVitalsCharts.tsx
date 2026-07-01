import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { type ChartPoint } from 'src/components/records/types';
import { type VitalsShift } from 'src/utils/date-vn';

type EpisodeVitalsChartsProps = {
  pulse: ChartPoint[];
  temperature: ChartPoint[];
  bpSystolic: ChartPoint[];
  bpDiastolic: ChartPoint[];
};

type SequentialRow = {
  key: string;
  label: string;
  shiftLabel: string;
  value: number;
};

type BpSequentialRow = {
  key: string;
  label: string;
  shiftLabel: string;
  systolic: number | null;
  diastolic: number | null;
};

function compareChartPoints(a: ChartPoint, b: ChartPoint): number {
  if (a.date !== b.date) {
    return a.date.localeCompare(b.date);
  }

  if (a.shift === b.shift) {
    return 0;
  }

  return a.shift === 'morning' ? -1 : 1;
}

function toPointKey(date: string, shift: VitalsShift): string {
  return `${date}:${shift}`;
}

function formatTimelineLabel(date: string, shift: VitalsShift): string {
  const datePart = date.slice(5).replace('-', '/');
  const shiftPart = shift === 'morning' ? 'S' : 'C';

  return `${datePart} ${shiftPart}`;
}

function shiftDisplayLabel(shift: VitalsShift): string {
  return shift === 'morning' ? 'Sáng' : 'Chiều';
}

function buildSequentialRows(points: ChartPoint[]): SequentialRow[] {
  return [...points].sort(compareChartPoints).map((point) => ({
    key: toPointKey(point.date, point.shift),
    label: formatTimelineLabel(point.date, point.shift),
    shiftLabel: shiftDisplayLabel(point.shift),
    value: point.value,
  }));
}

function buildBpSequentialRows(
  systolic: ChartPoint[],
  diastolic: ChartPoint[],
): BpSequentialRow[] {
  const keys = new Set<string>();
  const sysByKey = new Map<string, number>();
  const diaByKey = new Map<string, number>();

  for (const point of systolic) {
    const key = toPointKey(point.date, point.shift);
    keys.add(key);
    sysByKey.set(key, point.value);
  }

  for (const point of diastolic) {
    const key = toPointKey(point.date, point.shift);
    keys.add(key);
    diaByKey.set(key, point.value);
  }

  return Array.from(keys)
    .sort((left, right) => {
      const [leftDate, leftShift] = left.split(':') as [string, VitalsShift];
      const [rightDate, rightShift] = right.split(':') as [string, VitalsShift];

      return compareChartPoints(
        { date: leftDate, shift: leftShift, value: 0 },
        { date: rightDate, shift: rightShift, value: 0 },
      );
    })
    .map((key) => {
      const [date, shift] = key.split(':') as [string, VitalsShift];

      return {
        key,
        label: formatTimelineLabel(date, shift),
        shiftLabel: shiftDisplayLabel(shift),
        systolic: sysByKey.get(key) ?? null,
        diastolic: diaByKey.get(key) ?? null,
      };
    });
}

type VitalsLineChartProps = {
  title: string;
  unit: string;
  data: SequentialRow[];
  referenceY?: number;
  domain?: [number | 'auto', number | 'auto'];
};

function VitalsLineChart({
  title,
  unit,
  data,
  referenceY,
  domain,
}: VitalsLineChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <p className="mt-6 text-center text-sm text-slate-500">Chưa có dữ liệu</p>
      </div>
    );
  }

  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
      <h3 className="text-sm font-semibold text-slate-900">
        {title}
        {unit ? <span className="font-normal text-slate-500"> ({unit})</span> : null}
      </h3>
      <div className="mt-3 h-52 w-full min-w-0">
        <ResponsiveContainer width="100%" height={208} minWidth={0}>
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#64748b' }}
              interval={0}
              angle={data.length > 6 ? -35 : 0}
              textAnchor={data.length > 6 ? 'end' : 'middle'}
              height={data.length > 6 ? 48 : 30}
            />
            <YAxis
              domain={domain}
              tick={{ fontSize: 11, fill: '#64748b' }}
              width={36}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '0.5rem',
                borderColor: '#e2e8f0',
                fontSize: '12px',
              }}
              formatter={(value) =>
                value === null || value === undefined
                  ? ['—', title]
                  : [`${value} ${unit}`.trim(), title]
              }
              labelFormatter={(_label, payload) => {
                const row = payload?.[0]?.payload as SequentialRow | undefined;

                return row ? `${row.shiftLabel} · ${row.label.replace(' S', '').replace(' C', '')}` : '';
              }}
            />
            {referenceY !== undefined ? (
              <ReferenceLine
                y={referenceY}
                stroke="#94a3b8"
                strokeDasharray="4 4"
              />
            ) : null}
            <Line
              type="monotone"
              dataKey="value"
              name={title}
              stroke="#0284c7"
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        S = Sáng · C = Chiều · {data.length} chỉ số theo thời gian
      </p>
    </div>
  );
}

function BpChart({
  systolic,
  diastolic,
}: {
  systolic: ChartPoint[];
  diastolic: ChartPoint[];
}) {
  const data = buildBpSequentialRows(systolic, diastolic);

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Huyết áp (mmHg)</h3>
        <p className="mt-6 text-center text-sm text-slate-500">Chưa có dữ liệu</p>
      </div>
    );
  }

  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
      <h3 className="text-sm font-semibold text-slate-900">
        Huyết áp <span className="font-normal text-slate-500">(mmHg)</span>
      </h3>
      <div className="mt-3 h-52 w-full min-w-0">
        <ResponsiveContainer width="100%" height={208} minWidth={0}>
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#64748b' }}
              interval={0}
              angle={data.length > 6 ? -35 : 0}
              textAnchor={data.length > 6 ? 'end' : 'middle'}
              height={data.length > 6 ? 48 : 30}
            />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} width={36} />
            <Tooltip
              contentStyle={{
                borderRadius: '0.5rem',
                borderColor: '#e2e8f0',
                fontSize: '12px',
              }}
              labelFormatter={(_label, payload) => {
                const row = payload?.[0]?.payload as BpSequentialRow | undefined;

                return row ? `${row.shiftLabel} · ${row.label.replace(' S', '').replace(' C', '')}` : '';
              }}
            />
            <Line
              type="monotone"
              dataKey="systolic"
              name="Tâm thu"
              stroke="#0284c7"
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="diastolic"
              name="Tâm trương"
              stroke="#7c3aed"
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-sky-600" />
          Tâm thu
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-violet-600" />
          Tâm trương
        </span>
        <span>S = Sáng · C = Chiều</span>
      </div>
    </div>
  );
}

export function EpisodeVitalsCharts({
  pulse,
  temperature,
  bpSystolic,
  bpDiastolic,
}: EpisodeVitalsChartsProps) {
  return (
    <div className="min-w-0 space-y-3">
      <div className="grid min-w-0 gap-3 lg:grid-cols-2">
        <VitalsLineChart
          title="Mạch"
          unit="l/p"
          data={buildSequentialRows(pulse)}
        />
        <VitalsLineChart
          title="Nhiệt độ"
          unit="°C"
          data={buildSequentialRows(temperature)}
          referenceY={37}
          domain={[35, 'auto']}
        />
      </div>
      <BpChart systolic={bpSystolic} diastolic={bpDiastolic} />
    </div>
  );
}
