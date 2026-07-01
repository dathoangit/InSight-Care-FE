export type RecordEnteredBy = {
  userId: string;
  username: string;
};

export type DailyRecord = {
  id: string;
  date: string;
  bedId: string;
  morningPatientName: string | null;
  eveningPatientName: string | null;
  morningPulse: number | null;
  morningTemp: number | null;
  morningBp: string | null;
  morningNote: string | null;
  eveningPulse: number | null;
  eveningTemp: number | null;
  eveningBp: string | null;
  eveningNote: string | null;
  isLocked: boolean;
  morningEnteredBy: RecordEnteredBy | null;
  eveningEnteredBy: RecordEnteredBy | null;
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

export type VitalsShift = 'morning' | 'evening';

export type BedStatusResponse = {
  serverDate: string;
  editableShift: VitalsShift;
  requestedDate: string;
  beds: BedTodayStatus[];
};

export type UpsertDailyRecordBody = {
  bedId: string;
  morningPatientName?: string | null;
  eveningPatientName?: string | null;
  morningPulse?: number | null;
  morningTemp?: number | null;
  morningBp?: string | null;
  morningNote?: string | null;
  eveningPulse?: number | null;
  eveningTemp?: number | null;
  eveningBp?: string | null;
  eveningNote?: string | null;
};

export type VitalsPoint = {
  patientName: string | null;
  pulse: number | null;
  temp: number | null;
  bp: string | null;
  bpSystolic: number | null;
  bpDiastolic: number | null;
  note: string | null;
  enteredBy: RecordEnteredBy | null;
};

export type ChartPoint = {
  date: string;
  shift: VitalsShift;
  value: number;
};

export type PatientEpisodeDailyRow = {
  date: string;
  morning: VitalsPoint | null;
  evening: VitalsPoint | null;
};

export type PatientEpisodeSummary = {
  latestPulse: number | null;
  latestTemp: number | null;
  latestBp: string | null;
  avgPulse: number | null;
  avgTemp: number | null;
  maxTemp: number | null;
  minTemp: number | null;
};

export type PatientEpisodeResponse = {
  patientName: string;
  bed: {
    bedId: string;
    bedName: string;
    roomName: string;
    floor: number;
  };
  startDate: string;
  endDate: string;
  anchorDate: string;
  totalDays: number;
  shiftsWithVitals: number;
  dailyRows: PatientEpisodeDailyRow[];
  chartSeries: {
    pulse: ChartPoint[];
    temperature: ChartPoint[];
    bpSystolic: ChartPoint[];
    bpDiastolic: ChartPoint[];
  };
  summary: PatientEpisodeSummary;
};

export type PatientEpisodeQuery = {
  bedId: string;
  patientName: string;
  anchorDate: string;
};
