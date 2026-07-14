import { useEffect, useLayoutEffect, useState } from 'react';

import { createAuthenticatedApi } from 'src/api/authenticated';
import { getPatientEpisode } from 'src/components/records/api';
import { type PatientEpisodeResponse } from 'src/components/records/types';
import {
  AnimatedModalShell,
  type AnimatedModalRenderProps,
} from 'src/components/ui/AnimatedModalShell';
import { ApiError } from 'src/utils/api';

import { EpisodeDailyTable } from './EpisodeDailyTable';
import { EpisodeHeader } from './EpisodeHeader';
import { EpisodeOtherAdmissionsSection } from './EpisodeOtherAdmissionsSection';
import { EpisodeSummaryCards } from './EpisodeSummaryCards';
import { EpisodeVitalsCharts } from './EpisodeVitalsCharts';

export type PatientEpisodeTarget = {
  bedId: string;
  patientName: string;
  patientCode?: string;
  anchorDate: string;
};

type PatientEpisodeModalProps = {
  token: string | null;
  target: PatientEpisodeTarget | null;
  onClose: () => void;
  onSwitchAdmission?: (target: PatientEpisodeTarget) => void;
};

type PatientEpisodeModalContentProps = AnimatedModalRenderProps & {
  episode: PatientEpisodeResponse | null;
  target: PatientEpisodeTarget;
  token: string | null;
  pending: boolean;
  error: string | null;
  onSwitchAdmission?: (target: PatientEpisodeTarget) => void;
};

function ChartSkeleton() {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="h-52 rounded-xl bg-slate-200" />
        <div className="h-52 rounded-xl bg-slate-200" />
      </div>
      <div className="h-52 rounded-xl bg-slate-200" />
    </div>
  );
}

function PatientEpisodeModalContent({
  episode,
  target,
  token,
  pending,
  error,
  onSwitchAdmission,
  requestClose,
  isClosing,
  hasEntered,
}: PatientEpisodeModalContentProps) {
  const [chartsReady, setChartsReady] = useState(false);

  useLayoutEffect(() => {
    if (!episode || !hasEntered) {
      return;
    }

    let frameId1 = 0;
    let frameId2 = 0;

    frameId1 = window.requestAnimationFrame(() => {
      frameId2 = window.requestAnimationFrame(() => {
        setChartsReady(true);
      });
    });

    return () => {
      window.cancelAnimationFrame(frameId1);
      window.cancelAnimationFrame(frameId2);
    };
  }, [episode, hasEntered]);

  useEffect(() => {
    if (!episode) {
      setChartsReady(false);
    }
  }, [episode]);

  const showHeavyContent = hasEntered;
  const showCharts = chartsReady;
  const effectivePatientCode =
    episode?.patientCode ?? target.patientCode ?? null;

  return (
    <div
      className={`min-h-0 flex-1 ${isClosing ? 'overflow-hidden' : 'overflow-y-auto'}`}>
      <div className="p-4 sm:p-6">
        {pending && !episode ? (
          <div className="space-y-4">
            <div className="h-20 animate-pulse rounded-xl bg-slate-200" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-20 animate-pulse rounded-xl bg-slate-200"
                />
              ))}
            </div>
            <div className="h-52 animate-pulse rounded-xl bg-slate-200" />
          </div>
        ) : null}

        {error ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
            <button
              type="button"
              onClick={requestClose}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-white">
              Đóng
            </button>
          </div>
        ) : null}

        {episode ? (
          <div className="space-y-4 sm:space-y-5">
            <EpisodeHeader
              episode={episode}
              anchorDate={target.anchorDate}
              onClose={requestClose}
            />
            {showHeavyContent ? (
              <div className="space-y-4 sm:space-y-5">
                <EpisodeSummaryCards summary={episode.summary} />
                {showCharts ? (
                  <EpisodeVitalsCharts
                    pulse={episode.chartSeries.pulse}
                    temperature={episode.chartSeries.temperature}
                    bpSystolic={episode.chartSeries.bpSystolic}
                    bpDiastolic={episode.chartSeries.bpDiastolic}
                  />
                ) : (
                  <ChartSkeleton />
                )}
                <EpisodeDailyTable rows={episode.dailyRows} />
                {effectivePatientCode && onSwitchAdmission ? (
                  <EpisodeOtherAdmissionsSection
                    token={token}
                    patientCode={effectivePatientCode}
                    patientName={episode.patientName}
                    currentBedId={episode.bed.bedId}
                    currentStartDate={episode.startDate}
                    currentEndDate={episode.endDate}
                    onSwitchAdmission={onSwitchAdmission}
                  />
                ) : null}
              </div>
            ) : (
              <ChartSkeleton />
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function PatientEpisodeModal({
  token,
  target,
  onClose,
  onSwitchAdmission,
}: PatientEpisodeModalProps) {
  const [episode, setEpisode] = useState<PatientEpisodeResponse | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!target) {
      setEpisode(null);
      setError(null);
      setPending(false);
      return;
    }

    if (!token) {
      return;
    }

    let cancelled = false;
    setPending(true);
    setError(null);
    setEpisode(null);

    const api = createAuthenticatedApi(token);

    void getPatientEpisode(api, target)
      .then((result) => {
        if (!cancelled) {
          setEpisode(result);
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
              : 'Không thể tải chi tiết bệnh nhân.';
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
  }, [target, token]);

  return (
    <AnimatedModalShell
      isOpen={Boolean(target)}
      onClose={onClose}
      closeAsSheet
      labelledBy="patient-episode-modal-title"
      panelClassName="flex max-h-[94vh] w-full min-w-0 max-w-4xl flex-col rounded-t-2xl border border-slate-200 bg-slate-50 shadow-xl sm:max-h-[90vh] sm:rounded-xl">
      {(modalProps) => {
        if (!target) {
          return null;
        }

        return (
          <PatientEpisodeModalContent
            {...modalProps}
            episode={episode}
            target={target}
            token={token}
            pending={pending}
            error={error}
            onSwitchAdmission={onSwitchAdmission}
          />
        );
      }}
    </AnimatedModalShell>
  );
}
