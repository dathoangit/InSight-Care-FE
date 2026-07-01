import { useEffect, useState } from 'react';

import { createAuthenticatedApi } from 'src/api/authenticated';
import { EnteredByLine } from 'src/components/records/EnteredByLine';
import {
  formatBp,
  formatNote,
  formatPulse,
  formatTemp,
} from 'src/components/records/format-vitals';
import { type BedTodayStatus, type RecordEnteredBy } from 'src/components/records/types';
import { formatPatientName } from 'src/utils/format-patient-name';

import { getHistory } from './api';
import { type DailyRecord } from './types';

type HistorySectionProps = {
  token: string | null;
  beds: BedTodayStatus[];
  serverDate: string;
  onPatientClick?: (
    bedId: string,
    patientName: string,
    anchorDate: string,
  ) => void;
};

function HistoryShiftCell({
  patientName,
  pulse,
  temp,
  bp,
  note,
  enteredBy,
  bedId,
  anchorDate,
  onPatientClick,
}: {
  patientName: string | null;
  pulse: number | null;
  temp: number | null;
  bp: string | null;
  note: string | null;
  enteredBy: RecordEnteredBy | null;
  bedId: string;
  anchorDate: string;
  onPatientClick?: (
    bedId: string,
    patientName: string,
    anchorDate: string,
  ) => void;
}) {
  const name = patientName?.trim();
  const hasData =
    Boolean(name) ||
    pulse !== null ||
    temp !== null ||
    Boolean(bp?.trim()) ||
    Boolean(note?.trim());

  if (!hasData) {
    return <span className="text-slate-300">—</span>;
  }

  return (
    <div className="min-w-[8rem] space-y-1">
      {name ? (
        onPatientClick ? (
          <button
            type="button"
            onClick={() => onPatientClick(bedId, name, anchorDate)}
            className="text-left text-sm font-medium text-blue-600 hover:text-blue-800">
            {formatPatientName(name)}
          </button>
        ) : (
          <p className="font-medium text-slate-800">{formatPatientName(name)}</p>
        )
      ) : null}
      <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-slate-700">
        {pulse !== null ? <span>Mạch {formatPulse(pulse)}</span> : null}
        {temp !== null ? <span>{formatTemp(temp)}°C</span> : null}
        {bp ? <span>{formatBp(bp)}</span> : null}
      </div>
      {note?.trim() ? (
        <p className="text-xs italic text-slate-600">{formatNote(note)}</p>
      ) : null}
      <EnteredByLine enteredBy={enteredBy} />
    </div>
  );
}

function getBedLabel(bedId: string, beds: BedTodayStatus[]): string {
  const bed = beds.find((item) => item.bedId === bedId);
  if (!bed) {
    return bedId.slice(0, 8);
  }

  return `${bed.bedName} (T${bed.floor} P${bed.roomName})`;
}

export function HistorySection({
  token,
  beds,
  serverDate,
  onPatientClick,
}: HistorySectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (!serverDate) {
      return;
    }

    setStartDate((current) => current || serverDate);
    setEndDate((current) => current || serverDate);
  }, [serverDate]);
  const [patientName, setPatientName] = useState('');
  const [bedId, setBedId] = useState('');
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!token) {
      return;
    }

    setPending(true);
    setError(null);
    setSearched(true);

    try {
      const api = createAuthenticatedApi(token);
      const result = await getHistory(api, {
        startDate,
        endDate,
        patientName: patientName.trim() || undefined,
        bedId: bedId || undefined,
      });
      setRecords(result);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Không thể tải lịch sử.';
      setError(message);
      setRecords([]);
    } finally {
      setPending(false);
    }
  };

  const resultSummary =
    searched && !pending
      ? records.length > 0
        ? `${records.length} bản ghi`
        : 'Không có kết quả'
      : null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left sm:px-5 sm:py-4">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900 sm:text-lg">
            Lịch sử bản ghi
          </h2>
          <p className="mt-0.5 truncate text-xs text-slate-500 sm:text-sm">
            {expanded
              ? 'Tra cứu chỉ số theo khoảng ngày, tên bệnh nhân hoặc giường.'
              : resultSummary ?? 'Ấn để mở tra cứu lịch sử'}
          </p>
        </div>
        <span
          className={`shrink-0 text-slate-400 transition-transform ${
            expanded ? 'rotate-180' : ''
          }`}
          aria-hidden>
          ▼
        </span>
      </button>

      {expanded ? (
        <div className="border-t border-slate-100 px-3 pb-4 pt-3 sm:px-5 sm:pb-5">
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
            <div>
              <label
                htmlFor="historyStart"
                className="block text-xs font-medium text-slate-700 sm:text-sm">
                Từ ngày
              </label>
              <input
                id="historyStart"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="historyEnd"
                className="block text-xs font-medium text-slate-700 sm:text-sm">
                Đến ngày
              </label>
              <input
                id="historyEnd"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="historyPatient"
                className="block text-xs font-medium text-slate-700 sm:text-sm">
                Tên bệnh nhân
              </label>
              <input
                id="historyPatient"
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="historyBed"
                className="block text-xs font-medium text-slate-700 sm:text-sm">
                Giường
              </label>
              <select
                id="historyBed"
                value={bedId}
                onChange={(e) => setBedId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm">
                <option value="">Tất cả</option>
                {beds.map((bed) => (
                  <option key={bed.bedId} value={bed.bedId}>
                    {bed.bedName} · T{bed.floor} P{bed.roomName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleSearch()}
            disabled={pending || !token}
            className="mt-3 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-4 sm:px-4 sm:py-2 sm:text-sm">
            {pending ? 'Đang tìm...' : 'Tìm kiếm'}
          </button>

          {error ? (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 sm:text-sm">
              {error}
            </div>
          ) : null}

          {searched ? (
            <div className="mt-3 overflow-x-auto sm:mt-4">
              <table className="min-w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="px-1 py-1.5 font-medium sm:px-2 sm:py-2">
                      Ngày
                    </th>
                    <th className="px-1 py-1.5 font-medium sm:px-2 sm:py-2">
                      Giường
                    </th>
                    <th className="px-1 py-1.5 font-medium sm:px-2 sm:py-2">
                      Sáng
                    </th>
                    <th className="px-1 py-1.5 font-medium sm:px-2 sm:py-2">
                      Chiều
                    </th>
                    <th className="px-1 py-1.5 font-medium sm:px-2 sm:py-2">
                      Khóa
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-1 py-3 text-slate-500 sm:px-2 sm:py-4">
                        Không có bản ghi phù hợp.
                      </td>
                    </tr>
                  ) : (
                    records.map((record) => (
                      <tr
                        key={record.id}
                        className="border-b border-slate-100">
                        <td className="px-1 py-1.5 sm:px-2 sm:py-2">
                          {record.date}
                        </td>
                        <td className="px-1 py-1.5 sm:px-2 sm:py-2">
                          {getBedLabel(record.bedId, beds)}
                        </td>
                        <td className="px-1 py-1.5 sm:px-2 sm:py-2">
                          <HistoryShiftCell
                            patientName={record.morningPatientName}
                            pulse={record.morningPulse}
                            temp={record.morningTemp}
                            bp={record.morningBp}
                            note={record.morningNote}
                            enteredBy={record.morningEnteredBy}
                            bedId={record.bedId}
                            anchorDate={record.date}
                            onPatientClick={onPatientClick}
                          />
                        </td>
                        <td className="px-1 py-1.5 sm:px-2 sm:py-2">
                          <HistoryShiftCell
                            patientName={record.eveningPatientName}
                            pulse={record.eveningPulse}
                            temp={record.eveningTemp}
                            bp={record.eveningBp}
                            note={record.eveningNote}
                            enteredBy={record.eveningEnteredBy}
                            bedId={record.bedId}
                            anchorDate={record.date}
                            onPatientClick={onPatientClick}
                          />
                        </td>
                        <td className="px-1 py-1.5 sm:px-2 sm:py-2">
                          {record.isLocked ? 'Có' : 'Không'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
