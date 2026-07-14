export type VitalAlertLevel = 'normal' | 'warning' | 'critical';

/**
 * Ward vital-sign alert thresholds aligned with Vietnamese clinical references:
 * - VSH/VNHA 2024 consensus & Phác đồ 53-2025 (Viện Tim)
 * - QĐ 3192/QĐ-BYT (Bộ Y tế) hypertension grading
 *
 * Blood pressure (inpatient / elderly-friendly — wider than outpatient diagnosis):
 * - Normal: systolic <160 and diastolic <110 (140/90, 150/95 are not flagged)
 * - Warning — tăng HA độ II: systolic 160–179 or diastolic 110–119
 * - Critical — tăng HA độ III / cấp cứu: systolic ≥180 or diastolic ≥120;
 *   hypotension <90/<60
 *
 * Temperature (BYT / common clinical practice):
 * - Normal: 36.5–37.4 °C
 * - Warning: 37.5–38.9 °C (sốt) or 35.0–36.4 °C (hạ thân nhiệt nhẹ)
 * - Critical: ≥39 °C (sốt cao) or <35 °C
 *
 * Pulse (adult resting, BYT):
 * - Normal: 60–100 bpm
 * - Warning: 50–59 or 101–120 bpm
 * - Critical: <50 or >120 bpm
 */
const VITAL_THRESHOLDS = {
  bp: {
    hypotensionSystolic: 90,
    hypotensionDiastolic: 60,
    warningSystolicMin: 160,
    warningSystolicMax: 179,
    criticalSystolic: 180,
    warningDiastolicMin: 110,
    warningDiastolicMax: 119,
    criticalDiastolic: 120,
  },
  temp: {
    hypothermiaCritical: 35,
    hypothermiaWarningMin: 35,
    hypothermiaWarningMax: 36.4,
    normalMin: 36.5,
    normalMax: 37.4,
    feverWarningMin: 37.5,
    feverWarningMax: 38.9,
    feverCritical: 39,
  },
  pulse: {
    bradycardiaCritical: 50,
    bradycardiaWarningMin: 50,
    bradycardiaWarningMax: 59,
    normalMin: 60,
    normalMax: 100,
    tachycardiaWarningMin: 101,
    tachycardiaWarningMax: 120,
    tachycardiaCritical: 120,
  },
} as const;

const BP_PATTERN = /^(\d{1,3})\s*\/\s*(\d{1,3})$/;

function pickHigherLevel(
  a: VitalAlertLevel,
  b: VitalAlertLevel,
): VitalAlertLevel {
  const rank: Record<VitalAlertLevel, number> = {
    normal: 0,
    warning: 1,
    critical: 2,
  };

  return rank[a] >= rank[b] ? a : b;
}

export function parseBloodPressure(
  value: string | null | undefined,
): { systolic: number; diastolic: number } | null {
  if (!value?.trim()) {
    return null;
  }

  const match = value.trim().match(BP_PATTERN);
  if (!match) {
    return null;
  }

  const systolic = Number(match[1]);
  const diastolic = Number(match[2]);

  if (!Number.isFinite(systolic) || !Number.isFinite(diastolic)) {
    return null;
  }

  return { systolic, diastolic };
}

export function getTemperatureAlertLevel(
  value: number | null | undefined,
): VitalAlertLevel {
  if (value === null || value === undefined) {
    return 'normal';
  }

  const { temp } = VITAL_THRESHOLDS;

  if (value >= temp.feverCritical || value < temp.hypothermiaCritical) {
    return 'critical';
  }

  if (
    (value >= temp.hypothermiaWarningMin &&
      value <= temp.hypothermiaWarningMax) ||
    (value >= temp.feverWarningMin && value <= temp.feverWarningMax)
  ) {
    return 'warning';
  }

  return 'normal';
}

export function getPulseAlertLevel(
  value: number | null | undefined,
): VitalAlertLevel {
  if (value === null || value === undefined) {
    return 'normal';
  }

  const { pulse } = VITAL_THRESHOLDS;

  if (value < pulse.bradycardiaCritical || value > pulse.tachycardiaCritical) {
    return 'critical';
  }

  if (
    (value >= pulse.bradycardiaWarningMin &&
      value <= pulse.bradycardiaWarningMax) ||
    (value >= pulse.tachycardiaWarningMin &&
      value <= pulse.tachycardiaWarningMax)
  ) {
    return 'warning';
  }

  return 'normal';
}

export function getBloodPressureAlertLevel(
  value: string | null | undefined,
): VitalAlertLevel {
  const parsed = parseBloodPressure(value);
  if (!parsed) {
    return 'normal';
  }

  const { systolic, diastolic } = parsed;
  const { bp } = VITAL_THRESHOLDS;

  let level: VitalAlertLevel = 'normal';

  if (
    systolic < bp.hypotensionSystolic ||
    systolic >= bp.criticalSystolic
  ) {
    level = 'critical';
  } else if (
    systolic >= bp.warningSystolicMin &&
    systolic <= bp.warningSystolicMax
  ) {
    level = 'warning';
  }

  if (
    diastolic < bp.hypotensionDiastolic ||
    diastolic >= bp.criticalDiastolic
  ) {
    level = pickHigherLevel(level, 'critical');
  } else if (
    diastolic >= bp.warningDiastolicMin &&
    diastolic <= bp.warningDiastolicMax
  ) {
    level = pickHigherLevel(level, 'warning');
  }

  return level;
}

export function getVitalAlertClass(level: VitalAlertLevel): string {
  switch (level) {
    case 'critical':
      return 'bg-rose-100 text-rose-700 font-medium';
    case 'warning':
      return 'bg-amber-100 text-amber-800 font-medium';
    default:
      return '';
  }
}
