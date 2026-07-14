import { useEffect, useState } from 'react';

import { createAuthenticatedApi } from 'src/api/authenticated';
import {
  formatBp,
  formatNote,
  formatPulse,
  formatTemp,
} from 'src/components/records/format-vitals';
import {
  type BedTodayStatus,
  type RecordEnteredBy,
} from 'src/components/records/types';
import { formatPatientName } from 'src/utils/format-patient-name';
import { formatBedLocation } from 'src/utils/floor-labels';
import { formatYmdDisplay } from 'src/utils/date-vn';

import { getHistory } from './api';
import { type DailyRecord, type HistoryAdmissionItem } from './types';

type HistorySectionProps = {
  token: string | null;
  beds: BedTodayStatus[];
  serverDate: string;
  onPatientClick?: (
    bedId: string,
    patientName: string,
    anchorDate: string,
    patientCode?: string,
  ) => void;
};

function formatLatestVitals(summary: HistoryAdmissionItem['summary']): string {
  const parts: string[] = [];

  if (summary.latestPulse !== null) {
    parts.push(`Mạch ${formatPulse(summary.latestPulse)}`);
  }

  if (summary.latestTemp !== null) {
    parts.push(`${formatTemp(summary.latestTemp)}°C`);
  }

  if (summary.latestBp) {
    parts.push(formatBp(summary.latestBp));
  }

  return parts.length > 0 ? parts.join(' · ') : 'Chưa có chỉ số';
}

function HistoryShiftCell({
  patientName,
  patientCode,
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
  patientCode: string | null;
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
    patientCode?: string,
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
            onClick={() =>
              onPatientClick(bedId, name, anchorDate, patientCode ?? undefined)
            }
            className="text-left text-sm font-medium text-blue-600 hover:text-blue-800">
            {formatPatientName(name)}
          </button>
        ) : (
          <p className="font-medium text-slate-800">{formatPatientName(name)}</p>
        )
      ) : null}
      {patientCode?.trim() ? (
        <p className="text-xs tabular-nums text-slate-500">
          Mã NB: {patientCode.trim()}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-slate-700">
        {pulse !== null ? <span>Mạch {formatPulse(pulse)}</span> : null}
        {temp !== null ? <span>{formatTemp(temp)}°C</span> : null}
        {bp ? <span>{formatBp(bp)}</span> : null}
      </div>
      {note?.trim() ? (
        <p className="text-xs italic text-slate-600">{formatNote(note)}</p>
      ) : null}
    </div>
  );
}

function getAdmissionBedLabel(
  admission: HistoryAdmissionItem,
  beds: BedTodayStatus[],
): string {
  const fromBeds = beds.find((item) => item.bedId === admission.bed.bedId);
  if (fromBeds) {
    return formatBedLocation(
      fromBeds.bedName,
      fromBeds.floor,
      fromBeds.roomName,
    );
  }

  return formatBedLocation(
    admission.bed.bedName,
    admission.bed.floor,
    admission.bed.roomName,
  );
}

function HistoryAdmissionCard({
  admission,
  beds,
  onPatientClick,
}: {
  admission: HistoryAdmissionItem;
  beds: BedTodayStatus[];
  onPatientClick?: HistorySectionProps['onPatientClick'];
}) {
  const name = admission.patientName?.trim();
  const cardClassName =
    'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left transition [touch-action:manipulation]';

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {name ? (
            <p className="text-base font-semibold leading-snug text-slate-900">
              {formatPatientName(name)}
            </p>
          ) : (
            <p className="text-base text-slate-300">—</p>
          )}
          {admission.patientCode?.trim() ? (
            <p className="mt-1 text-xs tabular-nums text-slate-500">
              Mã NB: {admission.patientCode.trim()}
            </p>
          ) : null}
        </div>
        <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 ring-1 ring-slate-200">
          {formatYmdDisplay(admission.startDate)} –{' '}
          {formatYmdDisplay(admission.endDate)}
        </span>
      </div>

      <p className="mt-2 text-sm text-slate-600">
        {getAdmissionBedLabel(admission, beds)}
      </p>
      <p className="mt-1 text-sm text-slate-600">
        {admission.totalDays} ngày · {admission.shiftsWithVitals} buổi có chỉ số
      </p>
      <p className="mt-2 text-sm text-slate-500">
        {formatLatestVitals(admission.summary)}
      </p>
    </>
  );

  if (name && onPatientClick) {
    return (
      <button
        type="button"
        onClick={() =>
          onPatientClick(
            admission.bed.bedId,
            name,
            admission.startDate,
            admission.patientCode ?? undefined,
          )
        }
        className={`${cardClassName} hover:border-sky-200 hover:bg-sky-50 active:bg-sky-100`}>
        {content}
      </button>
    );
  }

  return <div className={cardClassName}>{content}</div>;
}

function HistoryAdmissionResults({
  admissions,
  beds,
  onPatientClick,
}: {
  admissions: HistoryAdmissionItem[];
  beds: BedTodayStatus[];
  onPatientClick?: HistorySectionProps['onPatientClick'];
}) {
  if (admissions.length === 0) {
    return (
      <p className="px-1 py-3 text-sm text-slate-500 sm:px-2 sm:py-4">
        Không có đợt nằm viện phù hợp.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-3 sm:hidden">
        {admissions.map((admission) => (
          <HistoryAdmissionCard
            key={`${admission.bed.bedId}-${admission.startDate}-${admission.endDate}`}
            admission={admission}
            beds={beds}
            onPatientClick={onPatientClick}
          />
        ))}
      </div>

      <div className="hidden overflow-x-auto sm:block">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="min-w-[10rem] px-2 py-2 font-medium">
                Bệnh nhân
              </th>
              <th className="px-2 py-2 font-medium">Mã NB</th>
              <th className="px-2 py-2 font-medium">Nhập viện</th>
              <th className="px-2 py-2 font-medium">Ra viện</th>
              <th className="px-2 py-2 font-medium">Giường</th>
              <th className="px-2 py-2 font-medium">Thời gian</th>
              <th className="px-2 py-2 font-medium">Chỉ số mới nhất</th>
            </tr>
          </thead>
          <tbody>
            {admissions.map((admission) => {
              const name = admission.patientName?.trim();

              return (
                <tr
                  key={`${admission.bed.bedId}-${admission.startDate}-${admission.endDate}`}
                  className="border-b border-slate-100">
                  <td className="min-w-[10rem] whitespace-normal px-2 py-2">
                    {name ? (
                      onPatientClick ? (
                        <button
                          type="button"
                          onClick={() =>
                            onPatientClick(
                              admission.bed.bedId,
                              name,
                              admission.startDate,
                              admission.patientCode ?? undefined,
                            )
                          }
                          className="text-left font-medium text-blue-600 hover:text-blue-800">
                          {formatPatientName(name)}
                        </button>
                      ) : (
                        formatPatientName(name)
                      )
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-2 py-2 tabular-nums">
                    {admission.patientCode?.trim() || '—'}
                  </td>
                  <td className="px-2 py-2">
                    {formatYmdDisplay(admission.startDate)}
                  </td>
                  <td className="px-2 py-2">
                    {formatYmdDisplay(admission.endDate)}
                  </td>
                  <td className="px-2 py-2">
                    {getAdmissionBedLabel(admission, beds)}
                  </td>
                  <td className="px-2 py-2">
                    {admission.totalDays} ngày · {admission.shiftsWithVitals}{' '}
                    buổi
                  </td>
                  <td className="px-2 py-2 text-slate-600">
                    {formatLatestVitals(admission.summary)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function getBedLabel(bedId: string, beds: BedTodayStatus[]): string {
  const bed = beds.find((item) => item.bedId === bedId);
  if (!bed) {
    return bedId.slice(0, 8);
  }

  return formatBedLocation(bed.bedName, bed.floor, bed.roomName);
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
  const [patientCode, setPatientCode] = useState('');
  const [bedId, setBedId] = useState('');
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [admissions, setAdmissions] = useState<HistoryAdmissionItem[]>([]);
  const [resultView, setResultView] = useState<'daily' | 'admission'>('daily');
  const [total, setTotal] = useState(0);
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
        patientCode: patientCode.trim() || undefined,
        bedId: bedId || undefined,
      });
      setRecords(result.items);
      setAdmissions(result.admissions);
      setResultView(result.view);
      setTotal(result.total);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Không thể tải lịch sử.';
      setError(message);
      setRecords([]);
      setAdmissions([]);
      setResultView('daily');
      setTotal(0);
    } finally {
      setPending(false);
    }
  };

  const isAdmissionView = resultView === 'admission';
  const resultSummary =
    searched && !pending
      ? total > 0
        ? isAdmissionView
          ? `${total} đợt nằm viện`
          : `${total} bản ghi`
        : 'Không có kết quả'
      : null;

  return (
    <section className="min-w-0 overflow-x-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
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
              ? 'Tra cứu theo khoảng ngày, tên bệnh nhân, mã NB hoặc giường. Tìm theo bệnh nhân trả về từng đợt nằm viện.'
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
        <div className="min-w-0 border-t border-slate-100 px-3 pb-4 pt-3 sm:px-5 sm:pb-5">
          <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-5">
            <div className="min-w-0">
              <label
                htmlFor="historyStart"
                className="block text-xs font-medium text-slate-700 sm:text-sm">
                Từ ngày
              </label>
              <div className="date-input-shell mt-1">
                <input
                  id="historyStart"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="date-input-fit box-border w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm"
                />
              </div>
            </div>

            <div className="min-w-0">
              <label
                htmlFor="historyEnd"
                className="block text-xs font-medium text-slate-700 sm:text-sm">
                Đến ngày
              </label>
              <div className="date-input-shell mt-1">
                <input
                  id="historyEnd"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="date-input-fit box-border w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm"
                />
              </div>
            </div>

            <div className="min-w-0">
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
                className="mt-1 box-border min-w-0 max-w-full w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm"
              />
            </div>

            <div className="min-w-0">
              <label
                htmlFor="historyPatientCode"
                className="block text-xs font-medium text-slate-700 sm:text-sm">
                Mã NB
              </label>
              <input
                id="historyPatientCode"
                type="text"
                inputMode="numeric"
                value={patientCode}
                onChange={(e) =>
                  setPatientCode(e.target.value.replace(/\D/g, '').slice(0, 10))
                }
                className="mt-1 box-border min-w-0 max-w-full w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs tabular-nums sm:px-3 sm:py-2 sm:text-sm"
              />
            </div>

            <div className="min-w-0">
              <label
                htmlFor="historyBed"
                className="block text-xs font-medium text-slate-700 sm:text-sm">
                Giường
              </label>
              <select
                id="historyBed"
                value={bedId}
                onChange={(e) => setBedId(e.target.value)}
                className="mt-1 box-border min-w-0 max-w-full w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm">
                <option value="">Tất cả</option>
                {beds.map((bed) => (
                  <option key={bed.bedId} value={bed.bedId}>
                    {formatBedLocation(bed.bedName, bed.floor, bed.roomName)}
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
            <div className="mt-3 sm:mt-4">
              {isAdmissionView ? (
                <HistoryAdmissionResults
                  admissions={admissions}
                  beds={beds}
                  onPatientClick={onPatientClick}
                />
              ) : (
                <div className="overflow-x-auto">
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
                                patientCode={record.morningPatientCode}
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
                                patientCode={record.eveningPatientCode}
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
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
