import { formatYmdDisplay, type VitalsShift } from 'src/utils/date-vn';

import { EnteredByLine } from 'src/components/records/EnteredByLine';
import {
  formatBp,
  formatNote,
  formatPulse,
  formatTemp,
} from 'src/components/records/format-vitals';
import {
  type PatientEpisodeDailyRow,
  type VitalsPoint,
} from 'src/components/records/types';

type EpisodeDailyTableProps = {
  rows: PatientEpisodeDailyRow[];
};

function shiftHasVitals(point: VitalsPoint | null): boolean {
  if (!point) {
    return false;
  }

  return (
    point.pulse !== null ||
    point.temp !== null ||
    Boolean(point.bp?.trim()) ||
    Boolean(point.note?.trim())
  );
}

type MetricProps = {
  label: string;
  value: string;
  multiline?: boolean;
};

function Metric({ label, value, multiline = false }: MetricProps) {
  return (
    <div className={multiline ? 'col-span-full min-w-0' : 'min-w-0'}>
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p
        className={`mt-0.5 text-sm text-slate-900 sm:text-base ${
          multiline
            ? 'whitespace-pre-wrap font-normal leading-snug'
            : 'font-semibold tabular-nums'
        }`}>
        {value}
      </p>
    </div>
  );
}

type ShiftVitalsPanelProps = {
  shift: VitalsShift;
  point: VitalsPoint | null;
};

function ShiftVitalsPanel({ shift, point }: ShiftVitalsPanelProps) {
  const isMorning = shift === 'morning';
  const shiftLabel = isMorning ? 'Sáng' : 'Chiều';
  const hasData = shiftHasVitals(point);

  if (!hasData) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 px-3 py-3">
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
            isMorning
              ? 'bg-sky-50 text-sky-800'
              : 'bg-teal-50 text-teal-800'
          }`}>
          {shiftLabel}
        </span>
        <p className="mt-3 text-sm text-slate-400">Chưa có dữ liệu</p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border px-3 py-3 ${
        isMorning
          ? 'border-sky-100 bg-sky-50/40'
          : 'border-teal-100 bg-teal-50/40'
      }`}>
      <span
        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
          isMorning
            ? 'bg-sky-100 text-sky-900'
            : 'bg-teal-100 text-teal-900'
        }`}>
        {shiftLabel}
      </span>
      <dl className="mt-3 grid grid-cols-3 gap-2 sm:gap-3">
        <Metric label="Mạch" value={formatPulse(point?.pulse)} />
        <Metric
          label="Nhiệt"
          value={
            point?.temp !== null && point?.temp !== undefined
              ? `${formatTemp(point.temp)}°C`
              : '—'
          }
        />
        <Metric label="HA" value={formatBp(point?.bp)} />
        <Metric
          label="Ghi chú"
          value={formatNote(point?.note)}
          multiline
        />
      </dl>
      <EnteredByLine enteredBy={point?.enteredBy} className="mt-2" />
    </div>
  );
}

function DayCard({ row }: { row: PatientEpisodeDailyRow }) {
  const hasMorning = shiftHasVitals(row.morning);
  const hasEvening = shiftHasVitals(row.evening);

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-slate-900 sm:text-base">
          {formatYmdDisplay(row.date)}
        </h4>
        <span className="shrink-0 text-xs text-slate-500">
          {(hasMorning ? 1 : 0) + (hasEvening ? 1 : 0)}/2 ca
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
        <ShiftVitalsPanel shift="morning" point={row.morning} />
        <ShiftVitalsPanel shift="evening" point={row.evening} />
      </div>
    </article>
  );
}

export function EpisodeDailyTable({ rows }: EpisodeDailyTableProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center">
        <h3 className="text-sm font-semibold text-slate-900">
          Chi tiết theo ngày
        </h3>
        <p className="mt-2 text-sm text-slate-500">Chưa có dữ liệu</p>
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Chi tiết theo ngày
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {rows.length} ngày · mỗi ngày gồm ca Sáng và Chiều
          </p>
        </div>
      </div>
      <div className="space-y-2 sm:space-y-3">
        {rows.map((row) => (
          <DayCard key={row.date} row={row} />
        ))}
      </div>
    </section>
  );
}
