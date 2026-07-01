import { formatYmdDisplay } from 'src/utils/date-vn';
import { formatPatientName } from 'src/utils/format-patient-name';

import { type PatientEpisodeResponse } from 'src/components/records/types';

type EpisodeHeaderProps = {
  episode: PatientEpisodeResponse;
  onClose: () => void;
};

export function EpisodeHeader({ episode, onClose }: EpisodeHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
      <div className="min-w-0">
        <h2
          id="patient-episode-modal-title"
          className="truncate text-xl font-semibold text-slate-900 sm:text-2xl">
          {formatPatientName(episode.patientName)}
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {episode.bed.bedName} · Tầng {episode.bed.floor} · Phòng{' '}
          {episode.bed.roomName}
        </p>
        <p className="mt-2 inline-flex flex-wrap items-center gap-2 text-xs text-slate-500 sm:text-sm">
          <span className="rounded-full bg-sky-50 px-2.5 py-1 font-medium text-sky-800">
            {formatYmdDisplay(episode.startDate)} –{' '}
            {formatYmdDisplay(episode.endDate)}
          </span>
          <span>{episode.totalDays} ngày</span>
          <span>-</span>
          <span>{episode.shiftsWithVitals} buổi</span>
        </p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
        Đóng
      </button>
    </div>
  );
}
