export const HOSPITAL_FLOOR_LABELS = [
  '1-9',
  'CC-15',
  '16-25',
  '26-31',
] as const;

export type HospitalFloorLabel = (typeof HOSPITAL_FLOOR_LABELS)[number];

export function compareFloorLabels(left: string, right: string): number {
  const leftIndex = HOSPITAL_FLOOR_LABELS.indexOf(left as HospitalFloorLabel);
  const rightIndex = HOSPITAL_FLOOR_LABELS.indexOf(right as HospitalFloorLabel);

  if (leftIndex !== -1 && rightIndex !== -1) {
    return leftIndex - rightIndex;
  }

  if (leftIndex !== -1) {
    return -1;
  }

  if (rightIndex !== -1) {
    return 1;
  }

  return left.localeCompare(right, 'vi');
}

export function sortFloorLabels(floors: Iterable<string>): string[] {
  return Array.from(new Set(floors)).sort(compareFloorLabels);
}

export function formatBedLocation(
  bedName: string,
  floor: string,
  roomName: string,
): string {
  return `${bedName} (${floor} · P${roomName})`;
}
