export type { DailyRecord } from 'src/components/records/types';
import type { PatientAdmissionItem } from 'src/components/records/types';

export type HistoryAdmissionItem = PatientAdmissionItem & {
  patientName: string | null;
  patientCode: string | null;
};

export type HistoryQuery = {
  startDate: string;
  endDate: string;
  patientName?: string;
  patientCode?: string;
  medicalRecordCode?: string;
  bedId?: string;
  limit?: number;
  offset?: number;
};

export type HistoryResponse = {
  view: 'daily' | 'admission';
  items: import('src/components/records/types').DailyRecord[];
  admissions: HistoryAdmissionItem[];
  total: number;
  limit: number;
  offset: number;
};
