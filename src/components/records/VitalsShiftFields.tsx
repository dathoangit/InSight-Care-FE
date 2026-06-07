import {
  formatBloodPressureInput,
  formatPulseInput,
  formatTemperatureInput,
  parsePulseValue,
  type VitalsFieldErrors,
  VITALS_RANGES,
} from './vitals-input';

type VitalsShiftFieldsProps = {
  idPrefix: string;
  pulse: string;
  temp: string;
  bp: string;
  disabled: boolean;
  errors: VitalsFieldErrors;
  onPulseChange: (value: string) => void;
  onTempChange: (value: string) => void;
  onBpChange: (value: string) => void;
};

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}

export function VitalsShiftFields({
  idPrefix,
  pulse,
  temp,
  bp,
  disabled,
  errors,
  onPulseChange,
  onTempChange,
  onBpChange,
}: VitalsShiftFieldsProps) {
  const pulseIsZero = parsePulseValue(pulse) === 0;
  const bpDisabled = disabled || pulseIsZero;

  return (
    <>
      <div>
        <label htmlFor={`${idPrefix}-pulse`} className="block text-sm font-medium text-slate-700">
          Mạch
        </label>
        <input
          id={`${idPrefix}-pulse`}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={pulse}
          disabled={disabled}
          placeholder="VD: 72"
          onChange={(event) => onPulseChange(formatPulseInput(event.target.value))}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
        />
        <p className="mt-1 text-xs text-slate-500">
          {VITALS_RANGES.pulse.label}. Mạch = 0 → huyết áp bắt buộc 0/0.
        </p>
        <FieldError message={errors.pulse} />
      </div>

      <div>
        <label htmlFor={`${idPrefix}-temp`} className="block text-sm font-medium text-slate-700">
          Nhiệt độ
        </label>
        <input
          id={`${idPrefix}-temp`}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={temp}
          disabled={disabled}
          placeholder="VD: 375 → 37.5"
          onChange={(event) => onTempChange(formatTemperatureInput(event.target.value))}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
        />
        <p className="mt-1 text-xs text-slate-500">
          {VITALS_RANGES.temp.label}. Gõ liền không dấu chấm (VD: 375 → 37.5).
        </p>
        <FieldError message={errors.temp} />
      </div>

      <div>
        <label htmlFor={`${idPrefix}-bp`} className="block text-sm font-medium text-slate-700">
          Huyết áp
        </label>
        <input
          id={`${idPrefix}-bp`}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={bp}
          disabled={bpDisabled}
          placeholder={pulseIsZero ? '0/0' : 'VD: 12080 → 120/80'}
          onChange={(event) =>
            onBpChange(formatBloodPressureInput(event.target.value, pulse))
          }
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
        />
        <p className="mt-1 text-xs text-slate-500">
          {pulseIsZero
            ? 'Không có mạch — chỉ nhập 0/0.'
            : 'Tâm thu 40–300, tâm trương 20–200 mmHg; tâm thu > tâm trương.'}
        </p>
        <FieldError message={errors.bp} />
      </div>
    </>
  );
}
