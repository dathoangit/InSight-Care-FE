import { type AuthenticatedApi } from 'src/api/authenticated';

import { type DailyRecord, type HistoryQuery } from './types';

export function getHistory(
  api: AuthenticatedApi,
  query: HistoryQuery,
): Promise<DailyRecord[]> {
  return api.get<DailyRecord[]>('/records/history', {
    startDate: query.startDate,
    endDate: query.endDate,
    patientName: query.patientName,
    bedId: query.bedId,
  });
}
