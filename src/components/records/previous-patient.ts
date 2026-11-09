import { type VitalsShift } from 'src/utils/date-vn';

import { type BedTodayStatus } from './types';

/** Patient on the immediately previous shift for this bed (evening ← morning; morning ← yesterday). */
export function getPreviousShiftPatientName(
  bed: BedTodayStatus,
  shift: VitalsShift,
): string | null {
  if (shift === 'evening') {
    const name = bed.todayRecord?.morningPatientName?.trim();
    return name || null;
  }

  const name = bed.yesterdayPatientName?.trim();
  return name || null;
}

export function getPreviousShiftPatientCode(
  bed: BedTodayStatus,
  shift: VitalsShift,
): string | null {
  if (shift === 'evening') {
    const code = bed.todayRecord?.morningPatientCode?.trim();
    return code || null;
  }

  return bed.yesterdayPatientCode?.trim() || null;
}

export function getPreviousShiftMedicalRecordCode(
  bed: BedTodayStatus,
  shift: VitalsShift,
): string | null {
  if (shift === 'evening') {
    const code = bed.todayRecord?.morningMedicalRecordCode?.trim();
    return code || null;
  }

  return bed.yesterdayMedicalRecordCode?.trim() || null;
}
