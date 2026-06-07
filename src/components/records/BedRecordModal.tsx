import { useEffect, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';

import { createAuthenticatedApi } from 'src/api/authenticated';
import { ApiError } from 'src/utils/api';
import { formatPatientName } from 'src/utils/format-patient-name';
import {
  type VitalsShift,
  isShiftEditable,
} from 'src/utils/date-vn';

import { upsertRecord } from './api';
import { type BedTodayStatus, type DailyRecord } from './types';
import { VitalsShiftFields } from './VitalsShiftFields';
import {
  formatBloodPressureInput,
  formatPulseInput,
  temperatureToInputDisplay,
  validateShiftVitals,
  type VitalsFieldErrors,
} from './vitals-input';

type BedRecordModalProps = {
  token: string | null;
  bed: BedTodayStatus | null;
  shift: VitalsShift | null;
  onClose: () => void;
  onSaved: (record: DailyRecord) => void;
};

type FormState = {
  patientName: string;
  morningPulse: string;
  morningTemp: string;
  morningBp: string;
  eveningPulse: string;
  eveningTemp: string;
  eveningBp: string;
};

function toFormState(bed: BedTodayStatus, shift: VitalsShift): FormState {
  const record = bed.todayRecord;
  const shiftPatientName =
    shift === 'morning' ? record?.morningPatientName : record?.eveningPatientName;

  return {
    patientName: formatPatientName(shiftPatientName ?? ''),
    morningPulse: record?.morningPulse?.toString() ?? '',
    morningTemp: temperatureToInputDisplay(record?.morningTemp),
    morningBp:
      record?.morningPulse === 0
        ? record?.morningBp ?? '0/0'
        : record?.morningBp ?? '',
    eveningPulse: record?.eveningPulse?.toString() ?? '',
    eveningTemp: temperatureToInputDisplay(record?.eveningTemp),
    eveningBp:
      record?.eveningPulse === 0
        ? record?.eveningBp ?? '0/0'
        : record?.eveningBp ?? '',
  };
}

export function BedRecordModal({
  token,
  bed,
  shift,
  onClose,
  onSaved,
}: BedRecordModalProps) {
  const [form, setForm] = useState<FormState>({
    patientName: '',
    morningPulse: '',
    morningTemp: '',
    morningBp: '',
    eveningPulse: '',
    eveningTemp: '',
    eveningBp: '',
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<VitalsFieldErrors>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (bed && shift) {
      setForm(toFormState(bed, shift));
      setError(null);
      setFieldErrors({});
    }
  }, [bed, shift]);

  useEffect(() => {
    if (!bed || !shift) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [bed, shift]);

  if (!mounted || !bed || !shift) {
    return null;
  }

  const isLocked = bed.todayRecord?.isLocked ?? false;
  const canEdit = !isLocked && isShiftEditable(shift);
  const shiftLabel = shift === 'morning' ? 'Sáng' : 'Chiều';
  const pulseKey = shift === 'morning' ? 'morningPulse' : 'eveningPulse';
  const tempKey = shift === 'morning' ? 'morningTemp' : 'eveningTemp';
  const bpKey = shift === 'morning' ? 'morningBp' : 'eveningBp';
  const idPrefix = shift === 'morning' ? 'morning' : 'evening';

  const handlePulseChange = (value: string) => {
    const formatted = formatPulseInput(value);
    setForm((prev) => {
      const next = { ...prev, [pulseKey]: formatted };

      if (formatted === '0') {
        next[bpKey] = '0/0';
      } else if (prev[bpKey] === '0/0') {
        next[bpKey] = '';
      }

      return next;
    });
    setFieldErrors((prev) => ({ ...prev, pulse: undefined, bp: undefined }));
  };

  const handleTempChange = (value: string) => {
    setForm((prev) => ({ ...prev, [tempKey]: value }));
    setFieldErrors((prev) => ({ ...prev, temp: undefined }));
  };

  const handleBpChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      [bpKey]: formatBloodPressureInput(value, prev[pulseKey]),
    }));
    setFieldErrors((prev) => ({ ...prev, bp: undefined }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!token || !canEdit) {
      return;
    }

    const { errors, values } = validateShiftVitals(
      form[pulseKey],
      form[tempKey],
      form[bpKey],
    );

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Vui lòng kiểm tra lại các chỉ số sinh tồn.');
      return;
    }

    setPending(true);
    setError(null);
    setFieldErrors({});

    try {
      const api = createAuthenticatedApi(token);
      const formattedPatientName =
        formatPatientName(form.patientName).trim() || null;
      const body =
        shift === 'morning'
          ? {
              bedId: bed.bedId,
              morningPatientName: formattedPatientName,
              morningPulse: values.pulse,
              morningTemp: values.temp,
              morningBp: values.bp,
            }
          : {
              bedId: bed.bedId,
              eveningPatientName: formattedPatientName,
              eveningPulse: values.pulse,
              eveningTemp: values.temp,
              eveningBp: values.bp,
            };

      const record = await upsertRecord(api, body);
      onSaved(record);
      onClose();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Không thể lưu bản ghi.';
      setError(message);
    } finally {
      setPending(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bed-record-modal-title"
      onClick={onClose}>
      <div
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-slate-200 bg-white p-4 shadow-xl sm:rounded-xl sm:p-5"
        onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="bed-record-modal-title" className="text-lg font-semibold text-slate-900">
              Nhập chỉ số ca {shiftLabel}
            </h2>
            <p className="text-sm text-slate-600">
              {bed.bedName} · Tầng {bed.floor} · Phòng {bed.roomName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
            Đóng
          </button>
        </div>

        {bed.yesterdayPatientName ? (
          <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Bệnh nhân hôm qua:{' '}
            <span className="font-medium">
              {formatPatientName(bed.yesterdayPatientName)}
            </span>
          </p>
        ) : null}

        {!canEdit ? (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            {isLocked
              ? 'Bản ghi hôm nay đã khóa, không thể chỉnh sửa.'
              : shift === 'morning'
                ? 'Chỉ nhập ca Sáng từ 0h00 đến 11h59.'
                : 'Chỉ nhập ca Chiều từ 12h00 đến 23h59.'}
          </div>
        ) : null}

        {error ? (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="patientName" className="block text-sm font-medium text-slate-700">
              Tên bệnh nhân
            </label>
            <input
              id="patientName"
              type="text"
              value={form.patientName}
              disabled={!canEdit || pending}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  patientName: formatPatientName(e.target.value),
                }))
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
            />
          </div>

          <VitalsShiftFields
            idPrefix={idPrefix}
            pulse={form[pulseKey]}
            temp={form[tempKey]}
            bp={form[bpKey]}
            disabled={!canEdit || pending}
            errors={fieldErrors}
            onPulseChange={handlePulseChange}
            onTempChange={handleTempChange}
            onBpChange={handleBpChange}
          />

          <button
            type="submit"
            disabled={!canEdit || pending}
            className="w-full rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60">
            {pending ? 'Đang lưu...' : 'Lưu bản ghi'}
          </button>
        </form>
      </div>
    </div>,
    document.body,
  );
}
