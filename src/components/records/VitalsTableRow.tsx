import { type KeyboardEvent } from 'react';

import { type VitalsShift, isShiftEditable } from 'src/utils/date-vn';
import { formatPatientName } from 'src/utils/format-patient-name';

import { getFloorRowClass } from './floor-colors';
import { formatBp, formatPulse, formatTemp } from './format-vitals';
import { type BedTodayStatus } from './types';

type VitalsTableRowProps = {
  bed: BedTodayStatus;
  shift: VitalsShift;
  onCellClick: (bedId: string, shift: VitalsShift) => void;
};

function PatientNameCell({
  patientName,
  yesterdayPatientName,
}: {
  patientName: string | null | undefined;
  yesterdayPatientName: string | null;
}) {
  const name = patientName?.trim();

  if (name) {
    return <span className="font-medium text-slate-900">{formatPatientName(name)}</span>;
  }

  if (yesterdayPatientName) {
    return (
      <span className="italic text-slate-400" title="Bệnh nhân hôm qua">
        {formatPatientName(yesterdayPatientName)}
      </span>
    );
  }

  return <span className="text-slate-300">—</span>;
}

export function VitalsTableRow({
  bed,
  shift,
  onCellClick,
}: VitalsTableRowProps) {
  const record = bed.todayRecord;
  const isLocked = record?.isLocked ?? false;
  const canEdit = !isLocked && isShiftEditable(shift);
  const floorRowClass = getFloorRowClass(bed.floor);
  const roomLabel = `${bed.roomName} · ${bed.bedName}`;
  const shiftLabel = shift === 'morning' ? 'Sáng' : 'Chiều';

  const patientName =
    shift === 'morning' ? record?.morningPatientName : record?.eveningPatientName;
  const pulse =
    shift === 'morning' ? record?.morningPulse : record?.eveningPulse;
  const temp = shift === 'morning' ? record?.morningTemp : record?.eveningTemp;
  const bp = shift === 'morning' ? record?.morningBp : record?.eveningBp;

  const openEditor = () => {
    onCellClick(bed.bedId, shift);
  };

  const cellClass = `border border-black ${floorRowClass} cursor-pointer px-0.5 py-2 transition-colors [touch-action:manipulation] group-hover:bg-sky-100 group-active:bg-sky-200 [-webkit-tap-highlight-color:rgba(14,165,233,0.2)] sm:px-1 sm:py-1`;

  const title = canEdit
    ? `Nhập ca ${shiftLabel}`
    : isLocked
      ? 'Bản ghi đã khóa'
      : `Chỉ nhập ca ${shift === 'morning' ? 'Sáng (0h–11h59)' : 'Chiều (12h–23h59)'}`;

  const cellProps = {
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
  };

  return (
    <tr className={`group ${isLocked ? 'opacity-70' : ''}`}>
      <td {...cellProps} className={cellClass}>
        <span className="block truncate">{roomLabel}</span>
      </td>
      <td {...cellProps} className={cellClass}>
        <PatientNameCell
          patientName={patientName}
          yesterdayPatientName={bed.yesterdayPatientName}
        />
      </td>
      <td {...cellProps} className={cellClass}>
        {formatPulse(pulse)}
      </td>
      <td {...cellProps} className={cellClass}>
        {formatTemp(temp)}
      </td>
      <td {...cellProps} className={cellClass}>
        {formatBp(bp)}
      </td>
    </tr>
  );
}
