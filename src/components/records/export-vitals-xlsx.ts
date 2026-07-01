import * as XLSX from 'xlsx-js-style';

import { formatYmdDisplay, type VitalsShift } from 'src/utils/date-vn';
import { formatPatientName } from 'src/utils/format-patient-name';

import { type BedTodayStatus } from './types';

const MORNING_START_COL = 0;
const MORNING_END_COL = 5;
const EVENING_START_COL = 7;
const EVENING_END_COL = 12;
const TOTAL_COLS = 13;

const SHIFT_COLUMN_HEADERS = [
  'Giường',
  'Tên NB',
  'Mạch',
  'NĐ',
  'HA',
  'Ghi chú',
] as const;

const THIN_BORDER = { style: 'thin', color: { rgb: '000000' } };
const TABLE_BORDER = {
  top: THIN_BORDER,
  bottom: THIN_BORDER,
  left: THIN_BORDER,
  right: THIN_BORDER,
};

type FloorSectionMeta = {
  shiftHeaderRow: number;
  lastDataRow: number;
};

function compareBeds(a: BedTodayStatus, b: BedTodayStatus): number {
  const floorDiff = a.floor - b.floor;
  if (floorDiff !== 0) {
    return floorDiff;
  }

  const roomDiff = a.roomName.localeCompare(b.roomName, 'vi');
  if (roomDiff !== 0) {
    return roomDiff;
  }

  return a.bedName.localeCompare(b.bedName, 'vi');
}

function formatPulseExport(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

function formatTempExport(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value);
}

function formatBpExport(value: string | null | undefined): string {
  if (!value?.trim()) {
    return '';
  }

  return value.trim();
}

function formatNoteExport(value: string | null | undefined): string {
  if (!value?.trim()) {
    return '';
  }

  return value.trim();
}

function resolvePatientName(bed: BedTodayStatus, shift: VitalsShift): string {
  const record = bed.todayRecord;
  const rawName =
    shift === 'morning'
      ? record?.morningPatientName
      : record?.eveningPatientName;

  if (rawName?.trim()) {
    return formatPatientName(rawName.trim());
  }

  return '';
}

function getShiftCells(
  bed: BedTodayStatus,
  shift: VitalsShift,
): [string, string, string, string, string, string] {
  const record = bed.todayRecord;

  if (shift === 'morning') {
    return [
      bed.bedName,
      resolvePatientName(bed, shift),
      formatPulseExport(record?.morningPulse),
      formatTempExport(record?.morningTemp),
      formatBpExport(record?.morningBp),
      formatNoteExport(record?.morningNote),
    ];
  }

  return [
    bed.bedName,
    resolvePatientName(bed, shift),
    formatPulseExport(record?.eveningPulse),
    formatTempExport(record?.eveningTemp),
    formatBpExport(record?.eveningBp),
    formatNoteExport(record?.eveningNote),
  ];
}

function emptyRow(): string[] {
  return Array.from({ length: TOTAL_COLS }, () => '');
}

function addMerge(
  merges: XLSX.Range[],
  row: number,
  startCol: number,
  endCol: number,
): void {
  merges.push({
    s: { r: row, c: startCol },
    e: { r: row, c: endCol },
  });
}

function getOrCreateCell(
  worksheet: XLSX.WorkSheet,
  row: number,
  col: number,
): XLSX.CellObject {
  const address = XLSX.utils.encode_cell({ r: row, c: col });
  const existing = worksheet[address];

  if (existing) {
    return existing;
  }

  const cell: XLSX.CellObject = { t: 's', v: '' };
  worksheet[address] = cell;
  return cell;
}

function applyCellStyle(
  worksheet: XLSX.WorkSheet,
  row: number,
  col: number,
  style: XLSX.CellObject['s'],
): void {
  const cell = getOrCreateCell(worksheet, row, col);
  cell.s = { ...(cell.s ?? {}), ...style };
}

function applyTableBlockStyles(
  worksheet: XLSX.WorkSheet,
  startRow: number,
  endRow: number,
  startCol: number,
  endCol: number,
  options?: { centerAll?: boolean; headerBold?: boolean },
): void {
  for (let row = startRow; row <= endRow; row += 1) {
    for (let col = startCol; col <= endCol; col += 1) {
      const isHeaderRow = row === startRow + 1;
      const alignment = options?.centerAll || isHeaderRow
        ? { horizontal: 'center' as const, vertical: 'center' as const }
        : { vertical: 'center' as const };

      applyCellStyle(worksheet, row, col, {
        border: TABLE_BORDER,
        alignment,
        font: options?.headerBold && isHeaderRow ? { bold: true } : undefined,
      });
    }
  }
}

function applyShiftTitleStyles(
  worksheet: XLSX.WorkSheet,
  row: number,
  startCol: number,
  endCol: number,
): void {
  applyCellStyle(worksheet, row, startCol, {
    border: TABLE_BORDER,
    alignment: { horizontal: 'center', vertical: 'center' },
    font: { bold: true },
  });
}

function buildFloorSectionRows(
  floor: number,
  beds: BedTodayStatus[],
  startRow: number,
): {
  rows: string[][];
  merges: XLSX.Range[];
  nextRow: number;
  meta: FloorSectionMeta;
} {
  const rows: string[][] = [];
  const merges: XLSX.Range[] = [];
  let currentRow = startRow;

  const floorTitleRow = emptyRow();
  floorTitleRow[0] = `Tầng ${floor}`;
  rows.push(floorTitleRow);
  addMerge(merges, currentRow, MORNING_START_COL, TOTAL_COLS - 1);
  currentRow += 1;

  const shiftHeaderRowIndex = currentRow;
  const shiftHeaderRow = emptyRow();
  shiftHeaderRow[MORNING_START_COL] = 'Sáng';
  shiftHeaderRow[EVENING_START_COL] = 'Chiều';
  rows.push(shiftHeaderRow);
  addMerge(merges, currentRow, MORNING_START_COL, MORNING_END_COL);
  addMerge(merges, currentRow, EVENING_START_COL, EVENING_END_COL);
  currentRow += 1;

  const columnHeaderRow = emptyRow();
  SHIFT_COLUMN_HEADERS.forEach((header, index) => {
    columnHeaderRow[MORNING_START_COL + index] = header;
    columnHeaderRow[EVENING_START_COL + index] = header;
  });
  rows.push(columnHeaderRow);
  currentRow += 1;

  const floorBeds = beds
    .filter((bed) => bed.floor === floor)
    .sort(compareBeds);

  for (const bed of floorBeds) {
    const morningCells = getShiftCells(bed, 'morning');
    const eveningCells = getShiftCells(bed, 'evening');
    const dataRow = emptyRow();

    morningCells.forEach((value, index) => {
      dataRow[MORNING_START_COL + index] = value;
    });
    eveningCells.forEach((value, index) => {
      dataRow[EVENING_START_COL + index] = value;
    });

    rows.push(dataRow);
    currentRow += 1;
  }

  const lastDataRow = currentRow - 1;

  return {
    rows,
    merges,
    nextRow: currentRow,
    meta: {
      shiftHeaderRow: shiftHeaderRowIndex,
      lastDataRow,
    },
  };
}

function applyFloorTableStyles(
  worksheet: XLSX.WorkSheet,
  meta: FloorSectionMeta,
): void {
  const { shiftHeaderRow, lastDataRow } = meta;

  applyShiftTitleStyles(
    worksheet,
    shiftHeaderRow,
    MORNING_START_COL,
    MORNING_START_COL,
  );
  applyShiftTitleStyles(
    worksheet,
    shiftHeaderRow,
    EVENING_START_COL,
    EVENING_START_COL,
  );

  applyTableBlockStyles(
    worksheet,
    shiftHeaderRow,
    lastDataRow,
    MORNING_START_COL,
    MORNING_END_COL,
    { headerBold: true },
  );
  applyTableBlockStyles(
    worksheet,
    shiftHeaderRow,
    lastDataRow,
    EVENING_START_COL,
    EVENING_END_COL,
    { headerBold: true },
  );
}

export function exportVitalsToXlsx(
  beds: BedTodayStatus[],
  dateYmd: string,
): void {
  const dateDisplay = formatYmdDisplay(dateYmd);
  const rows: string[][] = [];
  const merges: XLSX.Range[] = [];
  const floorMetas: FloorSectionMeta[] = [];

  const titleRow = emptyRow();
  titleRow[0] = `Bảng theo dõi dấu hiệu sinh tồn — ngày ${dateDisplay}`;
  rows.push(titleRow);
  addMerge(merges, 0, MORNING_START_COL, TOTAL_COLS - 1);

  rows.push(emptyRow());

  let currentRow = 2;
  const floors = Array.from(new Set(beds.map((bed) => bed.floor))).sort(
    (a, b) => a - b,
  );

  for (let index = 0; index < floors.length; index += 1) {
    if (index > 0) {
      rows.push(emptyRow());
      currentRow += 1;
    }

    const section = buildFloorSectionRows(floors[index], beds, currentRow);
    rows.push(...section.rows);
    merges.push(...section.merges);
    floorMetas.push(section.meta);
    currentRow = section.nextRow;
  }

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet['!merges'] = merges;
  worksheet['!cols'] = [
    { wch: 18 },
    { wch: 22 },
    { wch: 8 },
    { wch: 8 },
    { wch: 10 },
    { wch: 24 },
    { wch: 4 },
    { wch: 18 },
    { wch: 22 },
    { wch: 8 },
    { wch: 8 },
    { wch: 10 },
    { wch: 24 },
  ];

  applyCellStyle(worksheet, 0, 0, {
    font: { bold: true, sz: 12 },
    alignment: { horizontal: 'center', vertical: 'center' },
  });

  for (const meta of floorMetas) {
    applyFloorTableStyles(worksheet, meta);
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'DSSX');
  XLSX.writeFile(workbook, `dssx-${dateYmd}.xlsx`);
}
