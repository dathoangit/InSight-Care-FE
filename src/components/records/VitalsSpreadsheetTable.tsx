import { type VitalsShift } from 'src/utils/date-vn';

import { type BedTodayStatus } from './types';
import { VitalsTableRow } from './VitalsTableRow';

const COLUMN_HEADERS = [
  { full: 'Giường', short: 'G' },
  { full: 'Họ và tên', short: 'Họ và tên' },
  { full: 'Mạch', short: 'M' },
  { full: 'Nhiệt độ', short: 'NĐ' },
  { full: 'Huyết áp', short: 'HA' },
  { full: 'Ghi chú', short: 'Note' },
] as const;

type VitalsSpreadsheetTableProps = {
  beds: BedTodayStatus[];
  editableShift: VitalsShift;
  anchorDate: string;
  onCellClick: (bedId: string, shift: VitalsShift) => void;
  onPatientClick: (bedId: string, patientName: string, anchorDate: string, patientCode?: string) => void;
  readOnly?: boolean;
};

type ShiftTableProps = {
  shift: VitalsShift;
  label: string;
  beds: BedTodayStatus[];
  editableShift: VitalsShift;
  anchorDate: string;
  onCellClick: (bedId: string, shift: VitalsShift) => void;
  onPatientClick: (bedId: string, patientName: string, anchorDate: string, patientCode?: string) => void;
  readOnly?: boolean;
};

function ShiftTable({
  shift,
  label,
  beds,
  editableShift,
  anchorDate,
  onCellClick,
  onPatientClick,
  readOnly,
}: ShiftTableProps) {
  return (
    <div className="w-full touch-manipulation">
      <table className="w-full table-fixed border-collapse text-center text-[10px] leading-tight sm:text-xs">
        <colgroup>
          <col className="w-[10%]" />
          <col className="w-[24%]" />
          <col className="w-[10%]" />
          <col className="w-[12%]" />
          <col className="w-[12%]" />
          <col className="w-[16%]" />
        </colgroup>
        <thead className="bg-gray-100">
          <tr>
            <th
              colSpan={6}
              className="border-b border-gray-200 px-0.5 py-1 text-sm font-bold text-gray-600 sm:px-1 sm:py-1.5">
              {label}
            </th>
          </tr>
          <tr>
            {COLUMN_HEADERS.map((header, index) => (
              <th
                key={`${shift}-${header.full}`}
                className={`border-b border-gray-200 py-0.5 font-semibold text-gray-600 sm:py-1 ${
                  index === COLUMN_HEADERS.length - 1
                    ? 'px-2 sm:px-3'
                    : 'px-0.5 sm:px-1'
                }`}>
                <span className="sm:hidden">{header.short}</span>
                <span className="hidden sm:inline">{header.full}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {beds.map((bed, rowIndex) => (
            <VitalsTableRow
              key={`${shift}-${bed.bedId}`}
              bed={bed}
              shift={shift}
              editableShift={editableShift}
              anchorDate={anchorDate}
              rowIndex={rowIndex}
              onCellClick={onCellClick}
              onPatientClick={onPatientClick}
              readOnly={readOnly}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function VitalsSpreadsheetTable({
  beds,
  editableShift,
  anchorDate,
  onCellClick,
  onPatientClick,
  readOnly = false,
}: VitalsSpreadsheetTableProps) {
  if (beds.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-slate-500 sm:text-sm">
        Không có giường trên tầng này.
      </p>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <ShiftTable
        shift="morning"
        label="Sáng"
        beds={beds}
        editableShift={editableShift}
        anchorDate={anchorDate}
        onCellClick={onCellClick}
        onPatientClick={onPatientClick}
        readOnly={readOnly}
      />
      <ShiftTable
        shift="evening"
        label="Chiều"
        beds={beds}
        editableShift={editableShift}
        anchorDate={anchorDate}
        onCellClick={onCellClick}
        onPatientClick={onPatientClick}
        readOnly={readOnly}
      />
    </div>
  );
}
