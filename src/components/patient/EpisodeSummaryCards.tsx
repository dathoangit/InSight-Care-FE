import { type PatientEpisodeSummary } from 'src/components/records/types';

import { formatBp, formatPulse, formatTemp } from 'src/components/records/format-vitals';

type EpisodeSummaryCardsProps = {
  summary: PatientEpisodeSummary;
};

type SummaryCardProps = {
  label: string;
  value: string;
  hint?: string;
};

function SummaryCard({ label, value, hint }: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 sm:px-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-900 sm:text-xl">
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}

export function EpisodeSummaryCards({ summary }: EpisodeSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
      <SummaryCard
        label="Mạch mới nhất"
        value={formatPulse(summary.latestPulse)}
        hint={
          summary.avgPulse !== null
            ? `TB ${formatPulse(summary.avgPulse)}`
            : undefined
        }
      />
      <SummaryCard
        label="Nhiệt độ TB"
        value={
          summary.avgTemp !== null ? `${formatTemp(summary.avgTemp)}°C` : '—'
        }
        hint={
          summary.latestTemp !== null
            ? `Mới nhất ${formatTemp(summary.latestTemp)}°C`
            : undefined
        }
      />
      <SummaryCard
        label="Nhiệt max"
        value={
          summary.maxTemp !== null ? `${formatTemp(summary.maxTemp)}°C` : '—'
        }
        hint={
          summary.minTemp !== null
            ? `Min ${formatTemp(summary.minTemp)}°C`
            : undefined
        }
      />
      <SummaryCard
        label="HA mới nhất"
        value={formatBp(summary.latestBp)}
      />
    </div>
  );
}
