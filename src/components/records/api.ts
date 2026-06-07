import { type AuthenticatedApi } from 'src/api/authenticated';

import {
  type BedTodayStatus,
  type DailyRecord,
  type UpsertDailyRecordBody,
} from './types';

export function getTodayStatus(api: AuthenticatedApi): Promise<BedTodayStatus[]> {
  return api.get<BedTodayStatus[]>('/records/today-status');
}

export function upsertRecord(
  api: AuthenticatedApi,
  body: UpsertDailyRecordBody,
): Promise<DailyRecord> {
  return api.post<DailyRecord, UpsertDailyRecordBody>('/records/upsert', body);
}
