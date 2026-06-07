export type DailyRecord = {
  id: string;
  date: string;
  bedId: string;
  morningPatientName: string | null;
  eveningPatientName: string | null;
  morningPulse: number | null;
  morningTemp: number | null;
  morningBp: string | null;
  eveningPulse: number | null;
  eveningTemp: number | null;
  eveningBp: string | null;
  isLocked: boolean;
};

export type BedTodayStatus = {
  bedId: string;
  roomId: string;
  floor: number;
  roomName: string;
  bedName: string;
  todayRecord: DailyRecord | null;
  yesterdayPatientName: string | null;
};

export type UpsertDailyRecordBody = {
  bedId: string;
  morningPatientName?: string | null;
  eveningPatientName?: string | null;
  morningPulse?: number | null;
  morningTemp?: number | null;
  morningBp?: string | null;
  eveningPulse?: number | null;
  eveningTemp?: number | null;
  eveningBp?: string | null;
};
