import { useEffect, useState, type FormEvent } from 'react';

import { createAuthenticatedApi } from 'src/api/authenticated';
import { AnimatedModalShell } from 'src/components/ui/AnimatedModalShell';
import { ApiError } from 'src/utils/api';
import { formatPatientName } from 'src/utils/format-patient-name';
import { type VitalsShift } from 'src/utils/date-vn';

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
  editableShift: VitalsShift;
  onClose: () => void;
  onSaved: (record: DailyRecord) => void;
};

type FormState = {
  patientName: string;
  morningPulse: string;
  morningTemp: string;
  morningBp: string;
  morningNote: string;
  eveningPulse: string;
  eveningTemp: string;
  eveningBp: string;
  eveningNote: string;
};

function getPreviousShiftPatientName(
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
    morningNote: record?.morningNote ?? '',
    eveningPulse: record?.eveningPulse?.toString() ?? '',
    eveningTemp: temperatureToInputDisplay(record?.eveningTemp),
    eveningBp:
      record?.eveningPulse === 0
        ? record?.eveningBp ?? '0/0'
        : record?.eveningBp ?? '',
    eveningNote: record?.eveningNote ?? '',
  };
}

export function BedRecordModal({
  token,
  bed,
  shift,
  editableShift,
  onClose,
  onSaved,
}: BedRecordModalProps) {
  const [form, setForm] = useState<FormState>({
    patientName: '',
    morningPulse: '',
    morningTemp: '',
    morningBp: '',
    morningNote: '',
    eveningPulse: '',
    eveningTemp: '',
    eveningBp: '',
    eveningNote: '',
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<VitalsFieldErrors>({});

  useEffect(() => {
    if (bed && shift) {
      setForm(toFormState(bed, shift));
      setError(null);
      setFieldErrors({});
    }
  }, [bed, shift]);

  return (
    <AnimatedModalShell
      isOpen={Boolean(bed && shift)}
      onClose={onClose}
      labelledBy="bed-record-modal-title"
      panelClassName="max-h-[92vh] w-full max-w-md overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-xl sm:rounded-xl">
      {(modalProps) => {
        if (!bed || !shift) {
          return null;
        }

        const { requestClose } = modalProps;

        const isLocked = bed.todayRecord?.isLocked ?? false;
        const canEdit = !isLocked && shift === editableShift;
        const shiftLabel = shift === 'morning' ? 'Sáng' : 'Chiều';
        const pulseKey = shift === 'morning' ? 'morningPulse' : 'eveningPulse';
        const tempKey = shift === 'morning' ? 'morningTemp' : 'eveningTemp';
        const bpKey = shift === 'morning' ? 'morningBp' : 'eveningBp';
        const noteKey = shift === 'morning' ? 'morningNote' : 'eveningNote';
        const idPrefix = shift === 'morning' ? 'morning' : 'evening';
        const previousShiftPatientName = getPreviousShiftPatientName(bed, shift);
        const previousShiftPatientDisplay = previousShiftPatientName
          ? formatPatientName(previousShiftPatientName)
          : null;
        const canFillPreviousPatient =
          canEdit &&
          previousShiftPatientDisplay !== null &&
          form.patientName.trim() !== previousShiftPatientDisplay;

        const handleFillPreviousPatient = () => {
          if (!previousShiftPatientDisplay) {
            return;
          }

          setForm((prev) => ({
            ...prev,
            patientName: previousShiftPatientDisplay,
          }));
        };

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

        const handleNoteChange = (value: string) => {
          setForm((prev) => ({ ...prev, [noteKey]: value }));
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
            const formattedNote = form[noteKey].trim() || null;
            const body =
              shift === 'morning'
                ? {
                    bedId: bed.bedId,
                    morningPatientName: formattedPatientName,
                    morningPulse: values.pulse,
                    morningTemp: values.temp,
                    morningBp: values.bp,
                    morningNote: formattedNote,
                  }
                : {
                    bedId: bed.bedId,
                    eveningPatientName: formattedPatientName,
                    eveningPulse: values.pulse,
                    eveningTemp: values.temp,
                    eveningBp: values.bp,
                    eveningNote: formattedNote,
                  };

            const record = await upsertRecord(api, body);
            onSaved(record);
            requestClose();
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

        return (
          <div className="max-h-[92vh] overflow-y-auto p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  id="bed-record-modal-title"
                  className="text-lg font-semibold text-slate-900">
                  Nhập chỉ số ca {shiftLabel}
                </h2>
                <p className="text-sm text-slate-600">
                  {bed.bedName} · Tầng {bed.floor} · Phòng {bed.roomName}
                </p>
              </div>
              <button
                type="button"
                onClick={requestClose}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                Đóng
              </button>
            </div>

            {previousShiftPatientDisplay && canEdit && !form.patientName.trim() ? (
              <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                BN liền trước trên giường này:{' '}
                <span className="font-medium">{previousShiftPatientDisplay}</span>
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
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label
                    htmlFor="patientName"
                    className="text-sm font-medium text-slate-700">
                    Tên bệnh nhân
                  </label>
                  {canFillPreviousPatient ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={handleFillPreviousPatient}
                      className="rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-800 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60">
                      Điền BN liền trước
                    </button>
                  ) : null}
                </div>
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
                note={form[noteKey]}
                disabled={!canEdit || pending}
                errors={fieldErrors}
                onPulseChange={handlePulseChange}
                onTempChange={handleTempChange}
                onBpChange={handleBpChange}
                onNoteChange={handleNoteChange}
              />

              <button
                type="submit"
                disabled={!canEdit || pending}
                className="w-full rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60">
                {pending ? 'Đang lưu...' : 'Lưu bản ghi'}
              </button>
            </form>
          </div>
        );
      }}
    </AnimatedModalShell>
  );
}
