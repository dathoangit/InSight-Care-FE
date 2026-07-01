import { type AuthenticatedApi } from 'src/api/authenticated';

import {
  type BedStatusResponse,
  type BedTodayStatus,
  type DailyRecord,
  type PatientEpisodeQuery,
  type PatientEpisodeResponse,
  type UpsertDailyRecordBody,
} from './types';

type GetBedStatusOptions = {
  /** When true, omit date so BE resolves today from server clock. */
  viewToday?: boolean;
  /** Historical calendar date from user picker (YYYY-MM-DD). */
  date?: string;
};

export function getBedStatus(
  api: AuthenticatedApi,
  options: GetBedStatusOptions = {},
): Promise<BedStatusResponse> {
  const params: Record<string, string | undefined> = {};

  if (!options.viewToday && options.date) {
    params.date = options.date;
  }

  return api.get<BedStatusResponse>('/records/today-status', params);
}

/** @deprecated Use getBedStatus instead */
export function getTodayStatus(api: AuthenticatedApi): Promise<BedTodayStatus[]> {
  return getBedStatus(api, { viewToday: true }).then((response) => response.beds);
}

export function upsertRecord(
  api: AuthenticatedApi,
  body: UpsertDailyRecordBody,
): Promise<DailyRecord> {
  return api.post<DailyRecord, UpsertDailyRecordBody>('/records/upsert', body);
}

export function getPatientEpisode(
  api: AuthenticatedApi,
  query: PatientEpisodeQuery,
): Promise<PatientEpisodeResponse> {
  return api.get<PatientEpisodeResponse>('/records/patient-episode', {
    bedId: query.bedId,
    patientName: query.patientName,
    anchorDate: query.anchorDate,
  });
}
