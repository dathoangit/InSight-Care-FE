export type VitalAlertLevel = 'normal' | 'warning' | 'critical';

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

  if (value >= 38 || value < 35) {
    return 'critical';
  }

  if ((value >= 35 && value < 36.1) || (value > 37.2 && value < 38)) {
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

  if (value < 50 || value > 120) {
    return 'critical';
  }

  if ((value >= 50 && value < 60) || (value > 100 && value <= 120)) {
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

  let level: VitalAlertLevel = 'normal';

  if (systolic < 90 || systolic >= 140) {
    level = 'critical';
  } else if (systolic > 120 && systolic < 140) {
    level = 'warning';
  }

  if (diastolic < 60 || diastolic >= 90) {
    level = pickHigherLevel(level, 'critical');
  } else if (diastolic > 80 && diastolic < 90) {
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
