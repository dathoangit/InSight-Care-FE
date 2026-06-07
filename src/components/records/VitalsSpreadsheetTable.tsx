import { type VitalsShift } from 'src/utils/date-vn';

import { type BedTodayStatus } from './types';
import { VitalsTableRow } from './VitalsTableRow';

const COLUMN_HEADERS = [
  { full: 'Phòng', short: 'P' },
  { full: 'Tên NB', short: 'Tên' },
  { full: 'Mạch', short: 'M' },
  { full: 'Nhiệt độ', short: 'NĐ' },
  { full: 'HA', short: 'HA' },
] as const;

type VitalsSpreadsheetTableProps = {
  beds: BedTodayStatus[];
  onCellClick: (bedId: string, shift: VitalsShift) => void;
};

type ShiftTableProps = {
  shift: VitalsShift;
  label: string;
  beds: BedTodayStatus[];
  onCellClick: (bedId: string, shift: VitalsShift) => void;
};

function ShiftTable({ shift, label, beds, onCellClick }: ShiftTableProps) {
  return (
    <div className="w-full touch-manipulation">
      <table className="w-full table-fixed border-collapse border border-black text-center text-[10px] leading-tight sm:text-xs">
        <colgroup>
          <col className="w-[20%]" />
          <col className="w-[24%]" />
          <col className="w-[12%]" />
          <col className="w-[14%]" />
          <col className="w-[14%]" />
        </colgroup>
        <thead className="bg-slate-100">
          <tr>
            <th
              colSpan={5}
              className="border border-black px-0.5 py-1 font-bold text-slate-900 sm:px-1 sm:py-1.5">
              {label}
            </th>
          </tr>
          <tr>
            {COLUMN_HEADERS.map((header) => (
              <th
                key={`${shift}-${header.full}`}
                className="border border-black px-0.5 py-0.5 font-semibold text-slate-700 sm:px-1 sm:py-1">
                <span className="sm:hidden">{header.short}</span>
                <span className="hidden sm:inline">{header.full}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {beds.map((bed) => (
            <VitalsTableRow
              key={`${shift}-${bed.bedId}`}
              bed={bed}
              shift={shift}
              onCellClick={onCellClick}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function VitalsSpreadsheetTable({
  beds,
  onCellClick,
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
        onCellClick={onCellClick}
      />
      <ShiftTable
        shift="evening"
        label="Chiều"
        beds={beds}
        onCellClick={onCellClick}
      />
    </div>
  );
}
