import { useEffect, useMemo, useState } from 'react';

import {
  formatIsoAsLocalDateTime,
  formatYmdDisplay,
  type VitalsShift,
} from 'src/utils/date-vn';

import { exportVitalsToXlsx } from './export-vitals-xlsx';
import { FloorTabs } from './FloorTabs';
import { type BedTodayStatus } from './types';
import { VitalsSpreadsheetTable } from './VitalsSpreadsheetTable';

type TodayStatusSectionProps = {
  data: BedTodayStatus[];
  isLoading: boolean;
  error: string | null;
  lastUpdatedAt: Date | null;
  selectedDate: string;
  serverDate: string;
  editableShift: VitalsShift;
  onSelectedDateChange: (date: string) => void;
  readOnly?: boolean;
  onCellClick: (bedId: string, shift: VitalsShift) => void;
  onPatientClick: (
    bedId: string,
    patientName: string,
    anchorDate: string,
  ) => void;
};

export function TodayStatusSection({
  data,
  isLoading,
  error,
  lastUpdatedAt,
  selectedDate,
  serverDate,
  editableShift,
  onSelectedDateChange,
  readOnly = false,
  onCellClick,
  onPatientClick,
}: TodayStatusSectionProps) {
  const dateDisplay = selectedDate ? formatYmdDisplay(selectedDate) : '—';
  const shiftLabel =
    editableShift === 'morning' ? 'Sáng (0h–11h59)' : 'Chiều (12h–23h59)';
  const floors = useMemo(
    () =>
      Array.from(new Set(data.map((bed) => bed.floor))).sort((a, b) => a - b),
    [data],
  );

  const [activeFloor, setActiveFloor] = useState<number | null>(null);

  useEffect(() => {
    if (floors.length === 0) {
      setActiveFloor(null);
      return;
    }

    if (activeFloor === null || !floors.includes(activeFloor)) {
      setActiveFloor(floors[0]);
    }
  }, [floors, activeFloor]);

  const bedsOnFloor = useMemo(
    () =>
      activeFloor === null
        ? []
        : data.filter((bed) => bed.floor === activeFloor),
    [data, activeFloor],
  );

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm sm:p-4">
      <div className="mb-4 flex items-end justify-between gap-2">
        <div className="flex items-end gap-2 sm:gap-3">
          <div>
            <input
              id="vitals-date"
              type="date"
              value={selectedDate}
              max={serverDate || undefined}
              disabled={!serverDate}
              onChange={(event) => {
                if (event.target.value) {
                  onSelectedDateChange(event.target.value);
                }
              }}
              className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </div>
          {serverDate && selectedDate !== serverDate ? (
            <button
              type="button"
              onClick={() => onSelectedDateChange(serverDate)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
              Hôm nay
            </button>
          ) : null}
        </div>
        <button
          type="button"
          disabled={!selectedDate || data.length === 0}
          onClick={() => exportVitalsToXlsx(data, selectedDate)}
          className="shrink-0 rounded-md border border-teal-600 bg-teal-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400">
          Xuất Excel
        </button>
      </div>

      <div className="text-center">
        <h2 className="text-lg font-bold uppercase tracking-wide text-slate-900 sm:text-lg">
          Bảng theo dõi dấu hiệu sinh tồn
        </h2>
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isLoading && data.length === 0 ? (
        <div className="mt-4 h-48 animate-pulse rounded-lg bg-slate-100" />
      ) : floors.length > 0 && activeFloor !== null ? (
        <div className="mt-4">
          <FloorTabs
            floors={floors}
            activeFloor={activeFloor}
            onChange={setActiveFloor}
          />
          <div className="rounded-b-lg border border-gray-200 border-t-0 bg-white p-0.5 sm:p-1">
            <VitalsSpreadsheetTable
              beds={bedsOnFloor}
              editableShift={editableShift}
              anchorDate={selectedDate}
              onCellClick={onCellClick}
              onPatientClick={onPatientClick}
              readOnly={readOnly}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
