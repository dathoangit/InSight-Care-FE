import { AnimatedModalShell } from 'src/components/ui/AnimatedModalShell';
import { formatPatientName } from 'src/utils/format-patient-name';

type NotePreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  note: string;
  bedName: string;
  patientName?: string | null;
  shiftLabel: string;
  onEdit?: () => void;
};

export function NotePreviewModal({
  isOpen,
  onClose,
  note,
  bedName,
  patientName,
  shiftLabel,
  onEdit,
}: NotePreviewModalProps) {
  const titleId = 'note-preview-title';
  const patientDisplay = patientName?.trim()
    ? formatPatientName(patientName)
    : null;

  return (
    <AnimatedModalShell
      isOpen={isOpen}
      onClose={onClose}
      labelledBy={titleId}
      panelClassName="w-full max-w-md rounded-t-2xl border border-slate-200 bg-white p-4 shadow-xl sm:rounded-xl sm:p-5">
      {({ requestClose }) => (
        <div className="space-y-4">
          <div>
            <h2 id={titleId} className="text-base font-semibold text-slate-900">
              Ghi chú
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {bedName}
              {patientDisplay ? ` · ${patientDisplay}` : ''} · Ca {shiftLabel}
            </p>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
            {note}
          </p>
          <div className="flex justify-end gap-2">
            {onEdit ? (
              <button
                type="button"
                onClick={onEdit}
                className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-800 hover:bg-sky-100">
                Chỉnh sửa
              </button>
            ) : null}
            <button
              type="button"
              onClick={requestClose}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Đóng
            </button>
          </div>
        </div>
      )}
    </AnimatedModalShell>
  );
}
