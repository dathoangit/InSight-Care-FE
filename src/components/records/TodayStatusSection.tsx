import { useEffect, useMemo, useState } from 'react';

import {
  formatIsoAsLocalDateTime,
  formatTodayYmdDisplay,
  getEditableShift,
  type VitalsShift,
} from 'src/utils/date-vn';

import { FloorTabs } from './FloorTabs';
import { type BedTodayStatus } from './types';
import { VitalsSpreadsheetTable } from './VitalsSpreadsheetTable';

type TodayStatusSectionProps = {
  data: BedTodayStatus[];
  isLoading: boolean;
  error: string | null;
  lastUpdatedAt: Date | null;
  onCellClick: (bedId: string, shift: VitalsShift) => void;
};

export function TodayStatusSection({
  data,
  isLoading,
  error,
  lastUpdatedAt,
  onCellClick,
}: TodayStatusSectionProps) {
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

  const bedCountByFloor = useMemo(() => {
    const counts: Record<number, number> = {};

    for (const bed of data) {
      counts[bed.floor] = (counts[bed.floor] ?? 0) + 1;
    }

    return counts;
  }, [data]);

  const bedsOnFloor = useMemo(
    () =>
      activeFloor === null
        ? []
        : data.filter((bed) => bed.floor === activeFloor),
    [data, activeFloor],
  );

  const editableShift = getEditableShift();
  const shiftLabel = editableShift === 'morning' ? 'Sáng (0h–11h59)' : 'Chiều (12h–23h59)';

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm sm:p-4">
      <div className="text-center">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-900 sm:text-lg">
          Bảng theo dõi dấu hiệu sinh tồn
        </h2>
        <p className="mt-1 text-xs text-slate-600 sm:text-sm">
          (Từ 0h ngày {formatTodayYmdDisplay()} đến 23h59 ngày{' '}
          {formatTodayYmdDisplay()})
        </p>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 sm:mt-4 sm:gap-3 sm:text-sm">
        <p>
          {data.length} giường · Ca nhập hiện tại:{' '}
          <span className="font-medium text-slate-900">{shiftLabel}</span>
        </p>
        {lastUpdatedAt ? (
          <p className="text-xs text-slate-500">
            Cập nhật lúc {formatIsoAsLocalDateTime(lastUpdatedAt.toISOString())}
          </p>
        ) : null}
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
            bedCountByFloor={bedCountByFloor}
            onChange={setActiveFloor}
          />
          <div className="border border-t-0 border-slate-300 p-0.5 sm:p-1">
            <VitalsSpreadsheetTable beds={bedsOnFloor} onCellClick={onCellClick} />
          </div>
        </div>
      ) : null}
    </section>
  );
}
