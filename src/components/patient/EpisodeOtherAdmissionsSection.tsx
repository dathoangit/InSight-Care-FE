import { useEffect, useMemo, useState } from 'react';

import { createAuthenticatedApi } from 'src/api/authenticated';
import { getPatientAdmissions } from 'src/components/records/api';
import {
  type PatientAdmissionItem,
  type PatientAdmissionsResponse,
} from 'src/components/records/types';
import { ApiError } from 'src/utils/api';
import { formatYmdDisplay } from 'src/utils/date-vn';

import { type PatientEpisodeTarget } from './PatientEpisodeModal';

type EpisodeOtherAdmissionsSectionProps = {
  token: string | null;
  patientCode: string;
  patientName: string;
  currentBedId: string;
  currentStartDate: string;
  currentEndDate: string;
  onSwitchAdmission: (target: PatientEpisodeTarget) => void;
};

function formatLatestVitals(summary: PatientAdmissionItem['summary']): string {
  const parts: string[] = [];

  if (summary.latestPulse !== null) {
    parts.push(`Mạch ${summary.latestPulse}`);
  }

  if (summary.latestTemp !== null) {
    parts.push(`${summary.latestTemp}°C`);
  }

  if (summary.latestBp) {
    parts.push(summary.latestBp);
  }

  return parts.length > 0 ? parts.join(' · ') : 'Chưa có chỉ số';
}

function isSameAdmission(
  left: { bedId: string; startDate: string; endDate: string },
  right: { bed: { bedId: string }; startDate: string; endDate: string },
): boolean {
  return (
    left.bedId === right.bed.bedId &&
    left.startDate === right.startDate &&
    left.endDate === right.endDate
  );
}

export function EpisodeOtherAdmissionsSection({
  token,
  patientCode,
  patientName,
  currentBedId,
  currentStartDate,
  currentEndDate,
  onSwitchAdmission,
}: EpisodeOtherAdmissionsSectionProps) {
  const [data, setData] = useState<PatientAdmissionsResponse | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !patientCode) {
      return;
    }

    let cancelled = false;
    setPending(true);
    setError(null);

    const api = createAuthenticatedApi(token);

    void getPatientAdmissions(api, patientCode)
      .then((result) => {
        if (!cancelled) {
          setData(result);
        }
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }

        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Không thể tải các lần nằm viện khác.';
        setError(message);
      })
      .finally(() => {
        if (!cancelled) {
          setPending(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, patientCode]);

  const otherAdmissions = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.admissions.filter(
      (admission) =>
        !isSameAdmission(
          {
            bedId: currentBedId,
            startDate: currentStartDate,
            endDate: currentEndDate,
          },
          admission,
        ),
    );
  }, [currentBedId, currentEndDate, currentStartDate, data]);

  if (pending && !data) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">
          Các lần nằm viện khác
        </h3>
        <div className="mt-3 h-16 animate-pulse rounded-lg bg-slate-200" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-xl border border-red-200 bg-red-50 p-4">
        <h3 className="text-sm font-semibold text-red-800">
          Các lần nằm viện khác
        </h3>
        <p className="mt-2 text-sm text-red-700">{error}</p>
      </section>
    );
  }

  if (otherAdmissions.length === 0) {
    return null;
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900 sm:text-base">
          Các lần nằm viện khác
        </h3>
        <span className="text-xs text-slate-500 sm:text-sm">
          Mã NB {patientCode} · {otherAdmissions.length} đợt
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-500 sm:text-sm">
        Chọn một đợt để xem thống kê chi tiết theo thời gian nằm viện đó.
      </p>

      <div className="mt-4 space-y-3">
        {otherAdmissions.map((admission) => (
          <button
            key={`${admission.bed.bedId}-${admission.startDate}-${admission.endDate}`}
            type="button"
            onClick={() =>
              onSwitchAdmission({
                bedId: admission.bed.bedId,
                patientName: data?.patientName ?? patientName,
                patientCode,
                anchorDate: admission.startDate,
              })
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-sky-200 hover:bg-sky-50">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-slate-900">
                {admission.bed.bedName} · P {admission.bed.floor} · Phòng{' '}
                {admission.bed.roomName}
              </p>
              <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700">
                {formatYmdDisplay(admission.startDate)} –{' '}
                {formatYmdDisplay(admission.endDate)}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {admission.totalDays} ngày · {admission.shiftsWithVitals} buổi có
              chỉ số
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {formatLatestVitals(admission.summary)}
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}
