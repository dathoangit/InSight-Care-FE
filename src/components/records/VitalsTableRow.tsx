import { type KeyboardEvent, useState } from 'react';

import { type VitalsShift } from 'src/utils/date-vn';
import { formatPatientName } from 'src/utils/format-patient-name';

import { getZebraRowClass } from './floor-colors';
import { EnteredByLine } from './EnteredByLine';
import { formatBp, formatNote, formatPulse, formatTemp } from './format-vitals';
import { NotePreviewModal } from './NotePreviewModal';
import { type BedTodayStatus } from './types';
import {
  getBloodPressureAlertLevel,
  getPulseAlertLevel,
  getTemperatureAlertLevel,
  getVitalAlertClass,
} from './vitals-status';

type VitalsTableRowProps = {
  bed: BedTodayStatus;
  shift: VitalsShift;
  editableShift: VitalsShift;
  anchorDate: string;
  rowIndex: number;
  onCellClick: (bedId: string, shift: VitalsShift) => void;
  onPatientClick: (
    bedId: string,
    patientName: string,
    anchorDate: string,
  ) => void;
  readOnly?: boolean;
};

function PatientNameCell({
  patientName,
  onPatientClick,
}: {
  patientName: string | null | undefined;
  onPatientClick: (name: string) => void;
}) {
  const name = patientName?.trim();

  if (name) {
    return (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onPatientClick(name);
        }}
        className="w-full truncate text-left text-[11px] font-medium text-blue-600 hover:text-blue-800 sm:text-sm">
        {formatPatientName(name)}
      </button>
    );
  }

  return <span className="text-slate-400">—</span>;
}

export function VitalsTableRow({
  bed,
  shift,
  editableShift,
  anchorDate,
  rowIndex,
  onCellClick,
  onPatientClick,
  readOnly = false,
}: VitalsTableRowProps) {
  const record = bed.todayRecord;
  const isLocked = record?.isLocked ?? false;
  const canEdit = !readOnly && !isLocked && shift === editableShift;
  const rowBgClass = getZebraRowClass(rowIndex);
  const shiftLabel = shift === 'morning' ? 'Sáng' : 'Chiều';

  const patientName =
    shift === 'morning'
      ? record?.morningPatientName
      : record?.eveningPatientName;
  const pulse =
    shift === 'morning' ? record?.morningPulse : record?.eveningPulse;
  const temp = shift === 'morning' ? record?.morningTemp : record?.eveningTemp;
  const bp = shift === 'morning' ? record?.morningBp : record?.eveningBp;
  const note = shift === 'morning' ? record?.morningNote : record?.eveningNote;
  const enteredBy =
    shift === 'morning' ? record?.morningEnteredBy : record?.eveningEnteredBy;

  const openEditor = () => {
    if (!canEdit) {
      return;
    }

    onCellClick(bed.bedId, shift);
  };

  const interactiveClass = canEdit
    ? 'cursor-pointer group-hover:bg-sky-50 group-active:bg-sky-100/80 [-webkit-tap-highlight-color:rgba(14,165,233,0.2)]'
    : '';
  const defaultCellClass = `border-b border-gray-200 ${rowBgClass} px-0.5 py-2 text-gray-900 transition-colors [touch-action:manipulation] sm:px-1 sm:py-1 ${interactiveClass}`;

  const getVitalCellClass = (alertClass: string) => {
    if (!alertClass) return defaultCellClass;
    return `border-b border-gray-200 px-0.5 py-2 transition-colors [touch-action:manipulation] sm:px-1 sm:py-1 ${interactiveClass} ${alertClass}`;
  };

  const dataClass = 'tabular-nums';
  const pulseAlertClass = getVitalAlertClass(getPulseAlertLevel(pulse));
  const tempAlertClass = getVitalAlertClass(getTemperatureAlertLevel(temp));
  const bpAlertClass = getVitalAlertClass(getBloodPressureAlertLevel(bp));
  const noteDisplay = formatNote(note);
  const noteText = note?.trim() ?? '';
  const hasNote = Boolean(noteText);
  const [notePreviewOpen, setNotePreviewOpen] = useState(false);

  const title = readOnly
    ? 'Chế độ xem lịch sử'
    : canEdit
      ? `Nhập ca ${shiftLabel}`
      : isLocked
        ? 'Bản ghi đã khóa'
        : `Chỉ nhập ca ${shift === 'morning' ? 'Sáng (0h–11h59)' : 'Chiều (12h–23h59)'}`;

  const cellProps = canEdit
    ? {
        onClick: openEditor,
        title,
        role: 'button' as const,
        tabIndex: 0,
        onKeyDown: (event: KeyboardEvent<HTMLTableCellElement>) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openEditor();
          }
        },
      }
    : { title };

  const noteCellClass = `${defaultCellClass} px-2 sm:px-3`;

  const openNotePreview = () => {
    if (hasNote) {
      setNotePreviewOpen(true);
    }
  };

  const noteCellProps = hasNote
    ? {
        title: 'Xem ghi chú',
        role: 'button' as const,
        tabIndex: 0,
        onClick: openNotePreview,
        onKeyDown: (event: KeyboardEvent<HTMLTableCellElement>) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openNotePreview();
          }
        },
      }
    : canEdit
      ? cellProps
      : { title: 'Không có ghi chú' };

  return (
    <tr className={`group ${isLocked ? 'opacity-75' : ''}`}>
      <td {...cellProps} className={`${defaultCellClass} text-center`}>
        <span className="block truncate text-center text-[10px] text-slate-800 sm:text-[11px]">
          {bed.bedName}
        </span>
      </td>
      <td {...cellProps} className={`${defaultCellClass} text-left`}>
        <PatientNameCell
          patientName={patientName}
          onPatientClick={(name) => onPatientClick(bed.bedId, name, anchorDate)}
        />
      </td>
      <td {...cellProps} className={`${getVitalCellClass(pulseAlertClass)} text-center`}>
        <span className={`${dataClass}`}>
          {formatPulse(pulse)}
        </span>
      </td>
      <td {...cellProps} className={`${getVitalCellClass(tempAlertClass)} text-center`}>
        <span className={`${dataClass}`}>
          {formatTemp(temp)}
        </span>
      </td>
      <td {...cellProps} className={`${getVitalCellClass(bpAlertClass)} text-center`}>
        <div>
          <span className={`${dataClass}`}>{formatBp(bp)}</span>
          <EnteredByLine enteredBy={enteredBy} className="mt-0.5" />
        </div>
      </td>
      <td
        {...noteCellProps}
        className={`${noteCellClass} text-center ${hasNote ? 'cursor-pointer hover:bg-slate-100/80' : ''}`}>
        <span
          className={`block truncate text-center text-[10px] sm:text-[11px] ${
            hasNote ? 'text-slate-700 underline decoration-slate-300 underline-offset-2' : 'text-gray-700'
          }`}>
          {noteDisplay}
        </span>
      </td>
      <NotePreviewModal
        isOpen={notePreviewOpen}
        onClose={() => setNotePreviewOpen(false)}
        note={noteText}
        bedName={bed.bedName}
        patientName={patientName}
        shiftLabel={shiftLabel}
        onEdit={
          canEdit
            ? () => {
                setNotePreviewOpen(false);
                openEditor();
              }
            : undefined
        }
      />
    </tr>
  );
}
