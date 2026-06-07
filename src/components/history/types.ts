export type { DailyRecord } from 'src/components/records/types';

export type HistoryQuery = {
  startDate: string;
  endDate: string;
  patientName?: string;
  bedId?: string;
};
