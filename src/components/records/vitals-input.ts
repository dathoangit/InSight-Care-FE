export const VITALS_RANGES = {
  pulse: { min: 0, max: 300, label: '0–300 /phút' },
  temp: { min: 30, max: 45, label: '30–45 °C' },
  bpSystolic: { min: 40, max: 300 },
  bpDiastolic: { min: 20, max: 200 },
} as const;

export function formatPulseInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 3);
  if (!digits) {
    return '';
  }

  const value = Number.parseInt(digits, 10);
  if (!Number.isFinite(value)) {
    return '';
  }

  if (value > VITALS_RANGES.pulse.max) {
    return String(VITALS_RANGES.pulse.max);
  }

  return digits;
}

export function formatTemperatureInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 3);
  if (!digits) {
    return '';
  }

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}.${digits.slice(2)}`;
}

export function formatBloodPressureInput(
  raw: string,
  pulseValue: string,
): string {
  const pulse = parsePulseValue(pulseValue);
  if (pulse === 0) {
    return '0/0';
  }

  const digits = raw.replace(/\D/g, '').slice(0, 6);
  if (!digits) {
    return '';
  }

  if (digits.length <= 3) {
    return digits;
  }

  return `${digits.slice(0, 3)}/${digits.slice(3)}`;
}

export function parsePulseValue(display: string): number | null {
  const trimmed = display.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

export function parseTemperatureValue(display: string): number | null {
  const trimmed = display.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = Number.parseFloat(trimmed);
  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

export function temperatureToInputDisplay(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export type VitalsFieldErrors = {
  pulse?: string;
  temp?: string;
  bp?: string;
};

export type ParsedShiftVitals = {
  pulse: number | null | undefined;
  temp: number | null | undefined;
  bp: string | null | undefined;
};

export function validateShiftVitals(
  pulseDisplay: string,
  tempDisplay: string,
  bpDisplay: string,
): { errors: VitalsFieldErrors; values: ParsedShiftVitals } {
  const errors: VitalsFieldErrors = {};
  let pulse: number | null | undefined;
  let temp: number | null | undefined;
  let bp: string | null | undefined;

  const pulseTrimmed = pulseDisplay.trim();
  const tempTrimmed = tempDisplay.trim();
  const bpTrimmed = bpDisplay.trim();

  if (pulseTrimmed) {
    const parsedPulse = parsePulseValue(pulseTrimmed);
    if (parsedPulse === null) {
      errors.pulse = 'Mạch không hợp lệ.';
    } else if (
      parsedPulse < VITALS_RANGES.pulse.min ||
      parsedPulse > VITALS_RANGES.pulse.max
    ) {
      errors.pulse = `Mạch phải từ ${VITALS_RANGES.pulse.min} đến ${VITALS_RANGES.pulse.max} /phút.`;
    } else {
      pulse = parsedPulse;
    }
  } else {
    pulse = undefined;
  }

  if (tempTrimmed) {
    const parsedTemp = parseTemperatureValue(tempTrimmed);
    if (parsedTemp === null) {
      errors.temp = 'Nhiệt độ không hợp lệ.';
    } else if (
      parsedTemp < VITALS_RANGES.temp.min ||
      parsedTemp > VITALS_RANGES.temp.max
    ) {
      errors.temp = `Nhiệt độ phải từ ${VITALS_RANGES.temp.min} đến ${VITALS_RANGES.temp.max} °C.`;
    } else {
      temp = parsedTemp;
    }
  } else {
    temp = undefined;
  }

  if (bpTrimmed) {
    if (pulse === 0) {
      if (bpTrimmed !== '0/0') {
        errors.bp = 'Khi mạch = 0, huyết áp bắt buộc là 0/0.';
      } else {
        bp = '0/0';
      }
    } else if (pulse !== undefined && pulse !== null && pulse > 0) {
      const match = bpTrimmed.match(/^(\d{1,3})\/(\d{1,3})$/);
      if (!match) {
        errors.bp = 'Huyết áp phải theo dạng tâm thu/tâm trương (VD: 120/80).';
      } else {
        const systolic = Number.parseInt(match[1], 10);
        const diastolic = Number.parseInt(match[2], 10);

        if (
          systolic < VITALS_RANGES.bpSystolic.min ||
          systolic > VITALS_RANGES.bpSystolic.max
        ) {
          errors.bp = `Tâm thu phải từ ${VITALS_RANGES.bpSystolic.min} đến ${VITALS_RANGES.bpSystolic.max} mmHg.`;
        } else if (
          diastolic < VITALS_RANGES.bpDiastolic.min ||
          diastolic > VITALS_RANGES.bpDiastolic.max
        ) {
          errors.bp = `Tâm trương phải từ ${VITALS_RANGES.bpDiastolic.min} đến ${VITALS_RANGES.bpDiastolic.max} mmHg.`;
        } else if (systolic <= diastolic) {
          errors.bp = 'Tâm thu phải lớn hơn tâm trương.';
        } else {
          bp = `${systolic}/${diastolic}`;
        }
      }
    } else {
      const match = bpTrimmed.match(/^(\d{1,3})\/(\d{1,3})$/);
      if (!match) {
        errors.bp = 'Huyết áp phải theo dạng tâm thu/tâm trương (VD: 120/80).';
      } else {
        const systolic = Number.parseInt(match[1], 10);
        const diastolic = Number.parseInt(match[2], 10);

        if (systolic === 0 && diastolic === 0) {
          errors.bp = '0/0 chỉ được dùng khi mạch = 0.';
        } else if (
          systolic < VITALS_RANGES.bpSystolic.min ||
          systolic > VITALS_RANGES.bpSystolic.max
        ) {
          errors.bp = `Tâm thu phải từ ${VITALS_RANGES.bpSystolic.min} đến ${VITALS_RANGES.bpSystolic.max} mmHg.`;
        } else if (
          diastolic < VITALS_RANGES.bpDiastolic.min ||
          diastolic > VITALS_RANGES.bpDiastolic.max
        ) {
          errors.bp = `Tâm trương phải từ ${VITALS_RANGES.bpDiastolic.min} đến ${VITALS_RANGES.bpDiastolic.max} mmHg.`;
        } else if (systolic <= diastolic) {
          errors.bp = 'Tâm thu phải lớn hơn tâm trương.';
        } else {
          bp = `${systolic}/${diastolic}`;
        }
      }
    }
  } else {
    bp = undefined;
  }

  if (pulse === 0 && !bpTrimmed) {
    errors.bp = 'Khi mạch = 0, huyết áp bắt buộc là 0/0.';
  }

  return { errors, values: { pulse, temp, bp } };
}
