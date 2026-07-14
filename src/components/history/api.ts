import { type AuthenticatedApi } from 'src/api/authenticated';

import { type HistoryQuery, type HistoryResponse } from './types';

export function getHistory(
  api: AuthenticatedApi,
  query: HistoryQuery,
): Promise<HistoryResponse> {
  return api.get<HistoryResponse>('/records/history', {
    startDate: query.startDate,
    endDate: query.endDate,
    patientName: query.patientName,
    patientCode: query.patientCode,
    bedId: query.bedId,
    limit: query.limit,
    offset: query.offset,
  });
}
